import { Server, Socket } from "socket.io";
import { realtimeQuizController } from "../../controllers/realtimeQuiz.controller";
import { websocketController } from "../../controllers/websocket.controller";
import { webSocketAppEvents } from "../constants/websocket-events";
// ソケット拡張型を定義
// interface AuthenticatedSocket extends Socket {
//   userId: string;
// }

// データ型定義
interface SessionJoinData {
  userId: string;
  roomCode: string;
  sessionId: string;
  name: string;
  avatar: string;
  isGuest: boolean;
}

interface SessionLeaveData {
  sessionId: string;
  participantId: string;
  isHost: boolean;
}

export function registerNotificationHandlers(io: Server): void {
  io.on(webSocketAppEvents.CONNECT, (socket: Socket) => {
    // 接続時の処理
    socket.on(webSocketAppEvents.SESSION_DATA, async (data: { sessionId: string }) => {
      try {
        const { sessionId } = data;

        // セッション内の全参加者情報を取得
        const participantsList = await websocketController.getParticipants(sessionId);

        if (sessionId) {
          // セッション情報と現在の参加者リストをクライアントに送信
          socket.emit(webSocketAppEvents.SESSION_DATA_RESPONSE, {
            participants: participantsList,
            sessionId,
            // 必要に応じて他のセッション情報も追加
            currentState: await websocketController.getSessionState(sessionId),
          });

          // セッションルームに参加
          socket.join(sessionId);
          // biome-ignore lint/suspicious/noConsoleLog: <explanation>
          console.log(`Client ${socket.id} joined room ${sessionId} via SESSION_DATA`);
        }
      } catch (error) {
        console.error("Error fetching session data:", error);
        socket.emit(webSocketAppEvents.ERROR, {
          message: `Failed to fetch session data: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    });

    // ホスト部屋入室ハンドラー
    socket.on(
      webSocketAppEvents.HOST_JOINED,
      async (data: { roomCode: string; sessionId: string }) => {
        try {
          const { sessionId } = data;

          websocketController.saveHostSocketId(sessionId, socket.id);
        } catch (error) {
          console.error("Error creating session:", error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          socket.emit(webSocketAppEvents.ERROR, {
            message: `Failed to create session: ${errorMessage}`,
          });
        }
      },
    );

    // Join Room Request Handler
    socket.on(webSocketAppEvents.SESSION_JOIN_REQUEST, async (data: SessionJoinData) => {
      try {
        const { userId, name, avatar, isGuest } = data;

        const participant = await websocketController.joinRoom({
          ...data,
          socketId: socket.id,
        });
        const sessionId = data.sessionId ? data.sessionId : participant.sessionId;
        const participantId = participant.participantId;

        // Join the session room
        socket.join(sessionId);

        const allParticipants = await websocketController.getParticipants(sessionId);

        // Notify all participants in the session
        io.to(sessionId).emit(webSocketAppEvents.PARTICIPANT_JOINED, {
          participantId,
          name,
          avatar,
          isGuest,
          allParticipants,
        });

        // Notify the joining participant
        socket.emit(webSocketAppEvents.SESSION_JOIN_SUCCESS, {
          success: true,
          participantId,
          sessionId,
        });

        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log(`User ${userId} joined session ${sessionId} as participant ${participantId}`);
      } catch (error) {
        console.error("Error joining session:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        socket.emit(webSocketAppEvents.ERROR, {
          message: `Failed to join session: ${errorMessage}`,
        });
      }
    });

    // Leave Room Request Handler
    socket.on(webSocketAppEvents.SESSION_LEAVE_REQUEST, async (data: SessionLeaveData) => {
      try {
        const { sessionId, participantId, isHost } = data;

        // セッションルームから退出
        if (isHost) {
          const participant = await websocketController.getParticipantById({
            sessionId,
            participantId,
          });

          await websocketController.leaveRoom({
            sessionId,
            participantId,
          });

          io.to(participant.socketId).emit(webSocketAppEvents.PARTICIPANT_KICKED, {
            success: true,
            isHost,
          });
          io.to(sessionId).emit(webSocketAppEvents.PARTICIPANT_LEFT, { participantId });

          socket.emit(webSocketAppEvents.SESSION_LEAVE_SUCCESS, {
            success: true,
            participantId,
            isHost,
          });

          const targetSocket = io.sockets.sockets.get(participant.socketId);
          if (targetSocket) {
            targetSocket.leave(sessionId);
          }
          return;
        }

        // 参加者データをオフラインに更新
        await websocketController.leaveRoom({
          sessionId,
          participantId,
        });

        io.to(sessionId).emit(webSocketAppEvents.PARTICIPANT_LEFT, { participantId });

        socket.emit(webSocketAppEvents.SESSION_LEAVE_SUCCESS, {
          success: true,
          participantId,
          isHost,
        });

        if (!isHost) {
          socket.leave(sessionId);
          return;
        }
      } catch (error) {
        console.error("Error leaving session:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        socket.emit(webSocketAppEvents.ERROR, {
          message: `Failed to leave session: ${errorMessage}`,
        });
      }
    });

    // セッション終了ハンドラー
    socket.on(
      webSocketAppEvents.SESSION_CLOSE_REQUEST,
      async (data: { sessionId: string; isHost: boolean }) => {
        try {
          const { sessionId, isHost } = data;

          // セッションを終了
          await websocketController.closeSession(sessionId);

          // 参加者全員にセッション終了通知
          io.to(sessionId).emit(webSocketAppEvents.SESSION_CLOSE_SUCCESS, {
            success: true,
            sessionId,
            isHost,
          });

          // ルームを削除
          socket.leave(sessionId);

          // biome-ignore lint/suspicious/noConsoleLog: <explanation>
          console.log(`Session ${sessionId} closed by host ${isHost}`);
        } catch (error) {
          console.error("Error closing session:", error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          socket.emit(webSocketAppEvents.ERROR, {
            message: `Failed to close session: ${errorMessage}`,
          });
        }
      },
    );

    // Quiz start request handler
    socket.on(webSocketAppEvents.QUIZ_START_REQUEST, async (data: { sessionId: string }) => {
      try {
        const { sessionId } = data;
        // Get the session data for Quiz start
        const session = await websocketController.getSessionById(sessionId);
        if (!session) {
          throw new Error("Session not found");
        }

        const questionIds = await websocketController.getQuestionIds(sessionId);
        if (!questionIds || questionIds.length === 0) {
          throw new Error("No questions available for the quiz");
        }

        await realtimeQuizController.startQuiz({
          sessionId,
          questionIds,
        });

        const firstQuestionIndex = 0;
        const questionId = questionIds[firstQuestionIndex]; // Get the first question ID

        const firstQuestion = Object.values(session.questions).find(
          (question) => question.id === questionId,
        );
        if (!firstQuestion) {
          throw new Error("First question not found");
        }

        // Notify all participants about the quiz start
        io.to(sessionId).emit(webSocketAppEvents.QUIZ_STARTED, {
          question: firstQuestion,
          questionIndex: firstQuestionIndex,
          questionTotal: questionIds.length,
          timeLimit: 30,
        });
      } catch (error) {
        console.error("Error starting quiz:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        socket.emit(webSocketAppEvents.ERROR, {
          message: `Failed to start quiz: ${errorMessage}`,
        });
      }
    });

    // Quiz answer submission handler
    socket.on(
      webSocketAppEvents.QUIZ_SUBMIT_ANSWER,
      async (data: {
        sessionId: string;
        questionId: string;
        answer: string;
        participantId: string;
      }) => {
        try {
          const { sessionId, questionId, answer, participantId } = data;

          // Submit the answer
          const response = await realtimeQuizController.submitAnswer({
            sessionId,
            questionId,
            selectedOption: answer,
            participantId,
          });

          if (!response) {
            throw new Error("No data returned from submitAnswer");
          }

          const { isCorrect, answeredParticipantCount, optionDistribution } = response;

          // get the host's socket ID
          const hostId = await websocketController.getHostSocketId(sessionId);
          io.to(hostId).emit(webSocketAppEvents.ANSWER_RESULT_TO_HOST, {
            participantId,
            answer,
            isCorrect,
            answeredParticipantCount,
          });

          // Notify all participants about the answer result
          io.to(sessionId).emit(webSocketAppEvents.ANSWER_RESULT_TO_PARTICIPANTS, {
            answeredParticipantCount,
            optionDistribution,
          });
        } catch (error) {
          console.error("Error submitting answer:", error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          socket.emit(webSocketAppEvents.ERROR, {
            message: `Failed to submit answer: ${errorMessage}`,
          });
        }
      },
    );

    // Show results handler
    socket.on(
      webSocketAppEvents.QUIZ_SHOW_RESULTS,
      async (data: { showResults: boolean; sessionId: string; questionId: string }) => {
        try {
          const { showResults, sessionId } = data;
          if (!showResults) {
            return;
          }

          const sessionResults = await realtimeQuizController.getSessionResults(sessionId);

          if (!sessionResults) {
            throw new Error("No session results available");
          }

          // questionResultsがオブジェクトであることを確認
          const questionResultsEntries =
            sessionResults.questionResults && typeof sessionResults.questionResults === "object"
              ? Object.entries(sessionResults.questionResults)
              : [];

          const questionResult = questionResultsEntries.map(([questionId, result]) => ({
            questionId,
            ...(result as object), // resultをオブジェクトとして扱う
          }))[0];
          // questionResultがnullまたはundefinedでないことを確認
          if (!questionResult) {
            throw new Error("Question result not found");
          }

          // participantRankingを安全に取得
          const participantRanking = sessionResults.participantRanking || [];

          // 参加者全員に結果表示通知
          io.to(sessionId).emit(webSocketAppEvents.QUIZ_QUESTION_RESULT, {
            questionResult,
            participantRanking,
          });
        } catch (error) {
          console.error("Error showing results:", error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          socket.emit(webSocketAppEvents.ERROR, {
            message: `Failed to show results: ${errorMessage}`,
          });
        }
      },
    );

    // クイズ次の問題ハンドラー
    socket.on(webSocketAppEvents.QUIZ_NEXT_QUESTION, async (data: { sessionId: string }) => {
      try {
        const { sessionId } = data;
        const questionIds = await websocketController.getQuestionIds(sessionId);
        if (!questionIds || questionIds.length === 0) {
          throw new Error("No questions available for the quiz");
        }

        const response = await realtimeQuizController.getNextQuestion({
          sessionId,
          questionIds,
        });

        if (!response) {
          throw new Error("No next question available");
        }
        if (response.ended) {
          // クイズ終了
          const sessionResults = await realtimeQuizController.getSessionResults(sessionId);

          // セッション結果のデフォルト値を設定
          // const questionResults = [];
          let participantRanking = [];

          if (sessionResults) {
            // questionResultsがオブジェクトであることを確認して変換
            // if (
            // sessionResults.questionResults &&
            // typeof sessionResults.questionResults === "object"
            // ) {
            //   const questionResultsEntries = Object.entries(sessionResults.questionResults);
            //   // すべての質問結果を配列に変換
            //   const allQuestionResults = questionResultsEntries.map(([questionId, result]) => ({
            //     questionId,
            //     ...(result as object),
            //   }));

            //   if (allQuestionResults.length > 0) {
            //     questionResults.push(...allQuestionResults);
            //   }
            // }

            // participantRankingを取得
            participantRanking = sessionResults.participantRanking || [];
          }

          io.to(sessionId).emit(webSocketAppEvents.QUIZ_END, {
            ended: true,
            sessionId,
            // questionResults,
            participantRanking,
          });
          return;
        }

        // クイズ終了しない場合は次の問題を参加者全員に通知
        const { question, questionIndex, questionTotal } = response;

        io.to(sessionId).emit(webSocketAppEvents.QUIZ_QUESTION_UPDATE, {
          question,
          questionIndex,
          timeLimit: 10, // default time limit
          questionTotal,
        });
      } catch (error) {
        console.error("Error getting next question:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        socket.emit(webSocketAppEvents.ERROR, {
          message: `Failed to get next question: ${errorMessage}`,
        });
      }
    });

    // クイズ一時停止ハンドラー
    socket.on(
      webSocketAppEvents.QUIZ_PAUSE_REQUEST,
      async (data: { sessionId: string; questionId: string }) => {
        try {
          const { sessionId, questionId } = data;

          // クイズを一時停止
          await realtimeQuizController.pauseQuiz({
            sessionId,
            questionId,
          });

          // 参加者全員にクイズ一時停止通知
          io.to(sessionId).emit(webSocketAppEvents.QUIZ_PAUSED, {
            success: true,
            sessionId,
          });
        } catch (error) {
          console.error("Error pausing quiz:", error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          socket.emit(webSocketAppEvents.ERROR, {
            message: `Failed to pause quiz: ${errorMessage}`,
          });
        }
      },
    );

    // クイズ再開ハンドラー
    socket.on(
      webSocketAppEvents.QUIZ_RESUME_REQUEST,
      async (data: { sessionId: string; questionId: string }) => {
        try {
          const { sessionId, questionId } = data;

          // クイズを再開
          await realtimeQuizController.resumeQuiz({
            sessionId,
            questionId,
          });

          // 参加者全員にクイズ再開通知
          io.to(sessionId).emit(webSocketAppEvents.QUIZ_RESUMED, {
            success: true,
            sessionId,
          });
        } catch (error) {
          console.error("Error resuming quiz:", error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          socket.emit(webSocketAppEvents.ERROR, {
            message: `Failed to resume quiz: ${errorMessage}`,
          });
        }
      },
    );

    // セッション終了と関連データのクリーンアップを処理するハンドラー
    socket.on(webSocketAppEvents.SESSION_CLEANUP_REQUEST, async (data: { sessionId: string }) => {
      try {
        const { sessionId } = data;

        // セッションの終了をログに記録
        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log(`Terminating session: ${sessionId}`);

        // セッションデータを削除
        await realtimeQuizController.cleanupSession(sessionId);

        // 接続されているすべてのクライアントに通知
        io.to(sessionId).emit(webSocketAppEvents.SESSION_CLEANUP_DONE, {
          sessionId,
          message: "Session has been terminated and data cleaned up",
        });

        // ユーザーをルームから退出させる
        const socketsInRoom = await io.in(sessionId).fetchSockets();
        for (const clientSocket of socketsInRoom) {
          clientSocket.leave(sessionId);
        }

        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log(`Session ${sessionId} terminated successfully`);
      } catch (error) {
        // biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
        console.error(`Error terminating session:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        socket.emit(webSocketAppEvents.ERROR, {
          message: `Failed to terminate session: ${errorMessage}`,
        });
      }
    });
  });
}
