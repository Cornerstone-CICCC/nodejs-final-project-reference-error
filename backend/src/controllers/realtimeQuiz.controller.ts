import { Request, Response } from "express";
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

    // フロントエンドに通知
    // this.io.to(sessionId).emit('QUIZ_PAUSED', { sessionId, questionId, pausedAt });
  }

  // 質問を再開する関数
  async resumeQuestion(sessionId: string, questionId: string): Promise<void> {
    // 一時停止履歴を更新
    await realtimeQuizModel.recordResume(sessionId, questionId);

    // フロントエンドに通知
    // this.io.to(sessionId).emit('QUIZ_RESUMED', { sessionId, questionId, resumedAt });
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
  async processNextQuestion(
    sessionId: string,
    nextQuestionId: string,
    timeLimit: number,
  ): Promise<void> {
    await realtimeQuizModel.initializeQuestionProgress({
      sessionId,
      questionId: nextQuestionId,
      timeLimit,
    });
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

// WebSocketイベントを使ってコントローラー層を呼び出す
// export const setupRealtimeQuizSocketHandlers = (io: Socket) => {
//   io.on("connection", (socket) => {
//     socket.on("joinRoom", (sessionId: string) => {
//       socket.join(sessionId);
//       // biome-ignore lint/suspicious/noConsoleLog: <explanation>
//       console.log(`User joined room: ${sessionId}, socket ID: ${socket.id}`);

//       // クライアントからのイベントリスナー
//       // biome-ignore lint/suspicious/noExplicitAny: <explanation>

//       // biome-ignore lint/suspicious/noExplicitAny: <explanation>
//       socket.on("setPresence", async (data: any) => {
//         try {
//           const { participantId } = data;
//           await realtimeQuizDomain.processPresence(sessionId, participantId);
//           io.to(sessionId).emit("participantJoined", { participantId });
//         } catch (error) {
//           console.error("Error handling setPresence:", error);
//           socket.emit("error", { message: "Failed to set presence" });
//         }
//       });

//       // biome-ignore lint/suspicious/noExplicitAny: <explanation>
//       socket.on("updateLastActive", async (data: any) => {
//         try {
//           const { participantId } = data;
//           await realtimeQuizDomain.processLastActive(sessionId, participantId);
//         } catch (error) {
//           console.error("Error handling updateLastActive:", error);
//           socket.emit("error", { message: "Failed to update last active" });
//         }
//       });

//       // biome-ignore lint/suspicious/noExplicitAny: <explanation>
//       socket.on("startQuiz", async (data: any) => {
//         try {
//           const { questionIds, timeLimit } = data;
//           await realtimeQuizDomain.processQuizStart(sessionId, questionIds, timeLimit);
//           io.to(sessionId).emit("quizStarted");
//         } catch (error) {
//           console.error("Error handling startQuiz:", error);
//           socket.emit("error", { message: "Failed to start quiz" });
//         }
//       });

//       // biome-ignore lint/suspicious/noExplicitAny: <explanation>
//       socket.on("nextQuestion", async (data: any) => {
//         try {
//           const { nextQuestionId, timeLimit } = data;
//           await realtimeQuizDomain.processNextQuestion(sessionId, nextQuestionId, timeLimit);
//           io.to(sessionId).emit("nextQuestion", { questionId: nextQuestionId, timeLimit });
//         } catch (error) {
//           console.error("Error handling nextQuestion:", error);
//           socket.emit("error", { message: "Failed to start next question" });
//         }
//       });

//       socket.on("disconnect", () => {
//         // biome-ignore lint/suspicious/noConsoleLog: <explanation>
//         console.log(`User disconnected from room: ${sessionId}, socket ID: ${socket.id}`);
//         // プレゼンスを更新 (オフラインにする)
//         realtimeQuizDomain.processPresence(sessionId, socket.id); // socket.id を participantId として使用している場合
//       });
//     });
//   });
// };

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

      return {
        isCorrect,
        answeredParticipantCount,
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

  async setPresence(req: Request, res: Response) {
    try {
      const { sessionId, participantId } = req.params;
      await realtimeQuizDomain.processPresence(sessionId, participantId);
      res.status(200).json({ message: "Presence set" });
    } catch (error) {
      console.error("Error setting presence:", error);
      res.status(500).json({ error: "Failed to set presence" });
    }
  }

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

  // async nextQuestion(req: Request, res: Response) {
  //   try {
  //     const { sessionId, nextQuestionId, timeLimit } = req.body;
  //     await realtimeQuizDomain.processNextQuestion(sessionId, nextQuestionId, timeLimit);
  //     res.status(200).json({ message: "Next question started" });
  //   } catch (error) {
  //     console.error("Error starting next question:", error);
  //     res.status(500).json({ error: "Failed to start next question" });
  //   }
  // }
}

export const realtimeQuizController = new RealtimeQuizController();
