import { ParticipantModel } from "../models/participant.model";
import { RealtimeQuizModel } from "../models/realtimeQuiz.model";

const realtimeQuizModel = new RealtimeQuizModel();
const participantModel = new ParticipantModel();
type PauseRecord = {
  pausedAt: number;
  resumedAt: number | null;
};

export type ParticipantRanking = {
  id: string;
  name: string;
  score: number;
  rank: number;
  avatar?: string;
};

// ドメインロジックを担当するクラス
class RealtimeQuizDomain {
  // 回答を処理するドメインロジック
  async processAnswer(
    sessionId: string,
    questionId: string,
    participantId: string,
    selectedOption: string,
  ): Promise<{
    isCorrect: boolean;
    answeredParticipantCount: number;
  }> {
    // 1. 回答時間を記録
    await realtimeQuizModel.recordParticipantAnswered({
      sessionId,
      participantId,
    });
    const answeredAt = Date.now();
    const startedAt = await realtimeQuizModel.getQuestionStartTime(sessionId);

    if (!startedAt) {
      throw new Error("Start time not found");
    }
    // 一時停止情報を取得（型を明示的に指定）
    const pauseHistory: PauseRecord[] = (await realtimeQuizModel.getPausedTime(sessionId)) || [];
    let totalPausedTime = 0;
    // 一時停止履歴がある場合は合計停止時間を計算
    if (pauseHistory && pauseHistory.length > 0) {
      totalPausedTime = pauseHistory.reduce((total, pause) => {
        // 一時停止中の場合は現在時刻までの時間を加算
        if (pause.resumedAt === null) {
          return total + (answeredAt - pause.pausedAt);
        }
        // 既に再開された一時停止は開始から終了までの時間を加算
        return total + (pause.resumedAt - pause.pausedAt);
      }, 0);
    }

    const endAt = await realtimeQuizModel.getQuestionEndTime(sessionId);
    if (!endAt) {
      throw new Error("End time not found");
    }

    // 実際にかかった時間 = 経過時間 - 一時停止時間
    const timeSpent = answeredAt - startedAt - totalPausedTime;

    // 2. 正誤判定
    const correctAnswer = await realtimeQuizModel.getCorrectAnswer(sessionId, questionId);
    if (!correctAnswer) {
      throw new Error("Correct answer not found");
    }

    const isCorrect = selectedOption === correctAnswer;

    // 3. ポイント計算
    // 一時停止を考慮した有効制限時間を計算
    const effectiveTimeLimit = endAt - startedAt - totalPausedTime;
    const points = isCorrect ? this.calculatePoints(100, timeSpent, effectiveTimeLimit) : 0;

    // 4. 回答を保存
    await realtimeQuizModel.saveAnswer(
      sessionId,
      questionId,
      participantId,
      selectedOption,
      isCorrect,
      timeSpent,
      points,
    );

    // // 5. スコアを更新
    await realtimeQuizModel.updateParticipantScore(sessionId, participantId, points);

    await this.processQuestionCompletion(sessionId, questionId);

    return {
      isCorrect,
      answeredParticipantCount: (await realtimeQuizModel.getAnsweredParticipants(sessionId)).length,
    };
  }

  // 質問を一時停止する関数
  async pauseQuestion(sessionId: string, questionId: string): Promise<void> {
    // 現在のタイマー状態を保存
    await realtimeQuizModel.recordPause({
      sessionId,
      questionId,
    });
  }

  // 質問を再開する関数
  async resumeQuestion(sessionId: string, questionId: string): Promise<void> {
    // 一時停止履歴を更新
    await realtimeQuizModel.recordResume(sessionId, questionId);
  }

  // 質問完了を処理するドメインロジック
  async processQuestionCompletion(sessionId: string, questionId: string): Promise<void> {
    // 6. 全員が回答したかチェック
    const allAnswered = await realtimeQuizModel.checkIfAllAnswered(sessionId);
    const now = Date.now();
    const endTime = await realtimeQuizModel.getQuestionEndTime(sessionId);

    if (allAnswered || now >= endTime) {
      // 質問を完了としてマーク
      await realtimeQuizModel.completeQuestion(sessionId);

      // 回答結果を計算して保存
      await realtimeQuizModel.calculateAndStoreResults(sessionId, questionId);

      // ランキングを計算して保存
      const ranking = await this.calculateRanking(sessionId);
      await realtimeQuizModel.storeRanking(sessionId, questionId, ranking);
    }
  }

  // ランキング計算ロジック
  async calculateRanking(sessionId: string): Promise<ParticipantRanking[]> {
    // 参加者とスコアを取得
    const participants = await participantModel.getParticipants(sessionId);

    if (!participants || Object.keys(participants).length === 0) {
      return [];
    }

    const participantArray = Object.entries(participants).map(([id, data]) => ({
      id,
      name: data.name || "Unknown",
      score: data.score || 0,
      avatar: data.avatar || "default",
    }));

    // スコア降順でソート
    participantArray.sort((a, b) => b.score - a.score);

    // 順位を付ける（同点は同順位）
    let currentRank = 1;
    let previousScore: number | null = null;

    return participantArray.map((participant, index) => {
      // 前の参加者と同点でなければ、順位を更新
      if (previousScore !== participant.score) {
        currentRank = index + 1;
      }
      previousScore = participant.score;

      return {
        ...participant,
        rank: currentRank,
      };
    });
  }

  // クイズを開始するドメインロジック
  async processQuizStart({
    sessionId,
    questionIds,
    timeLimit,
  }: {
    sessionId: string;
    questionIds: string[];
    timeLimit: number;
  }): Promise<void> {
    const firstQuestionId = questionIds[0];
    await realtimeQuizModel.updateSessionStatus(sessionId, "active");
    await realtimeQuizModel.initializeQuestionProgress({
      sessionId,
      questionId: firstQuestionId,
      timeLimit,
    });
  }

  // 次の質問を開始するドメインロジック
  async processNextQuestion({
    sessionId,
    nextQuestionId,
    timeLimit,
  }: {
    sessionId: string;
    nextQuestionId: string;
    timeLimit: number;
  }): Promise<object> {
    await realtimeQuizModel.initializeQuestionProgress({
      sessionId,
      questionId: nextQuestionId,
      timeLimit,
    });

    const currentQuestion = await realtimeQuizModel.getNextQuestion(sessionId, nextQuestionId);
    if (!currentQuestion) {
      throw new Error("Next question not found");
    }

    return currentQuestion;
  }

  // プレゼンスを処理するドメインロジック
  async processPresence(sessionId: string, participantId: string): Promise<void> {
    await realtimeQuizModel.setPresence(sessionId, participantId);
    // WebSocketの通知はControllerで行う
  }

  // 最終アクティブタイムスタンプを更新するドメインロジック
  async processLastActive(sessionId: string, participantId: string): Promise<void> {
    await realtimeQuizModel.updateLastActive(sessionId, participantId);
    // WebSocketの通知はControllerで行う
  }

  // ポイント計算ロジック (例)
  private calculatePoints(basePoints: number, timeSpent: number, availableTime: number): number {
    // 時間が短いほど高得点
    const timeRatio = Math.max(0, 1 - timeSpent / availableTime);
    return Math.round(basePoints * (0.5 + 0.5 * timeRatio)); // 最低でも半分のポイント
  }
}

const realtimeQuizDomain = new RealtimeQuizDomain();

class RealtimeQuizController {
  async submitAnswer(data: {
    sessionId: string;
    questionId: string;
    participantId: string;
    selectedOption: string;
  }) {
    const { sessionId, questionId, participantId, selectedOption } = data;
    try {
      const response = await realtimeQuizDomain.processAnswer(
        sessionId,
        questionId,
        participantId,
        selectedOption,
      );

      const { isCorrect, answeredParticipantCount } = response;

      if (answeredParticipantCount === undefined) {
        throw new Error("Invalid response from processAnswer");
      }

      // 参加者のランキングスコアを更新
      await realtimeQuizModel.updateParticipantScore(
        sessionId,
        participantId,
        response.isCorrect ? 10 : 0,
      );

      // 参加者の回答分布を取得
      const optionDistribution = await realtimeQuizModel.getOptionDistribution(
        sessionId,
        questionId,
      );

      if (!optionDistribution) {
        return {
          isCorrect,
          answeredParticipantCount,
          optionDistribution: {},
        };
      }

      return {
        isCorrect,
        answeredParticipantCount,
        optionDistribution,
      };
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
  }

  async startQuiz(quizConfig: { sessionId: string; questionIds: string[] }) {
    try {
      const { sessionId, questionIds } = quizConfig;
      const timeLimit = 30; // default time limit in seconds
      await realtimeQuizDomain.processQuizStart({
        sessionId,
        questionIds,
        timeLimit,
      });
    } catch (error) {
      console.error("Error starting quiz:", error);
    }
  }

  async getSessionResults(sessionId: string) {
    try {
      const ranking = await realtimeQuizModel.getSessionResults(sessionId);
      if (!ranking) {
        throw new Error("session results not found");
      }
      return ranking;
    } catch (error) {
      console.error("Error fetching session results:", error);
    }
  }

  async getQuestionResults(sessionId: string, questionId: string) {
    try {
      const questionResults = await realtimeQuizModel.getQuestionResults(sessionId, questionId);
      if (!questionResults) {
        throw new Error("Question results not found");
      }
      return questionResults;
    } catch (error) {
      console.error("Error fetching question results:", error);
    }
  }

  async getNextQuestion(data: {
    sessionId: string;
    questionIds: string[];
  }) {
    try {
      const { sessionId, questionIds } = data;

      // currentQuestionIndexをupdate
      const result = await realtimeQuizModel.updateCurrentQuestionId({
        sessionId,
        questionIds,
      });

      // resultがundefinedの場合を処理
      if (!result) {
        console.error("Failed to update current question ID");
        throw new Error("Failed to update current question ID");
      }

      // 次の質問が存在しない場合（配列の最後に達した場合）
      if (!result.currentQuestionId) {
        // クイズ終了の処理を実行
        await this.endQuiz(sessionId);
        return { ended: true };
      }

      const timeLimit = 30; // default time limit in seconds
      const currentQuestion = await realtimeQuizDomain.processNextQuestion({
        sessionId,
        nextQuestionId: result.currentQuestionId,
        timeLimit,
      });

      if (currentQuestion === undefined) {
        throw new Error("Next question not found");
      }

      return {
        ended: false,
        question: currentQuestion,
        questionIndex: result.currentQuestionIndex,
        questionTotal: questionIds.length,
      };
    } catch (error) {
      console.error("Error starting next question:", error);
      throw error; // エラーを上位に伝搬させる
    }
  }

  // クイズ終了処理
  async endQuiz(sessionId: string) {
    try {
      // セッションのステータスを更新
      await realtimeQuizModel.updateSessionStatus(sessionId, "completed");

      return { success: true };
    } catch (error) {
      console.error("Error ending quiz:", error);
      throw error;
    }
  }

  async pauseQuiz({
    sessionId,
    questionId,
  }: {
    sessionId: string;
    questionId: string;
  }) {
    try {
      await realtimeQuizDomain.pauseQuestion(sessionId, questionId);
    } catch (error) {
      console.error("Error pausing quiz:", error);
    }
  }

  async resumeQuiz({
    sessionId,
    questionId,
  }: {
    sessionId: string;
    questionId: string;
  }) {
    try {
      await realtimeQuizDomain.resumeQuestion(sessionId, questionId);
    } catch (error) {
      console.error("Error resuming quiz:", error);
    }
  }

  async getAnswers(sessionId: string, questionId: string) {
    try {
      const answers = await realtimeQuizModel.getAnswers(sessionId, questionId);
      if (!answers) {
        throw new Error("Answers not found");
      }
      return answers;
    } catch (error) {
      console.error("Error fetching answers:", error);
      throw error;
    }
  }

  // realtimeQuizController.js
  async cleanupSession(sessionId: string) {
    try {
      // 1. セッションステータスを更新
      await realtimeQuizModel.updateSessionStatus(sessionId, "terminated");

      // 2. セッション結果を保存（オプション - 必要に応じて）
      // 結果が必要な場合は削除前に永続ストレージに保存

      // 3. Firebaseからセッション関連のデータを削除
      await realtimeQuizModel.removeSessionData(sessionId);

      return { success: true };
    } catch (error) {
      console.error("Error cleaning up session:", error);
      throw error;
    }
  }

  // async setPresence(req: Request, res: Response) {
  //   try {
  //     const { sessionId, participantId } = req.params;
  //     await realtimeQuizDomain.processPresence(sessionId, participantId);
  //     res.status(200).json({ message: "Presence set" });
  //   } catch (error) {
  //     console.error("Error setting presence:", error);
  //     res.status(500).json({ error: "Failed to set presence" });
  //   }
  // }

  // async updateLastActive(req: Request, res: Response) {
  //   try {
  //     const { sessionId, participantId } = req.params;
  //     await realtimeQuizDomain.processLastActive(sessionId, participantId);
  //     res.status(200).json({ message: "Last active updated" });
  //   } catch (error) {
  //     console.error("Error updating last active:", error);
  //     res.status(500).json({ error: "Failed to update last active" });
  //   }
  // }
}

export const realtimeQuizController = new RealtimeQuizController();
