"use client";
import type { Question } from "@/types/Question";
import type { ReactNode } from "react";
import type { Socket } from "socket.io-client";
import { type StoreApi, create } from "zustand";
import { QUIZ_STATES, type QuizState } from "../constants/quizState";
import { webSocketAppEvents } from "../constants/websocket-events";
import { useWebSocket } from "../contexts/WebSocketContext";
import { useParticipantStore } from "./participantStore";

// Zustand store definition
interface QuizStore {
  quizState: QuizState;
  currentQuestion: Question | null;
  timeRemaining: number;
  hasAnswered: boolean;
  selectedAnswer: string | null;
  isHost: boolean;
  sessionId: string | null;
  socket: Socket | null;
  myParticipantId: string | null;
  questionTotal: number;
  questionIndex: number;
  currentRanking: ParticipantRanking[];
  showResults: boolean;
  questionResult: QuestionResult | null;
  questionFinalResults: QuestionResult[] | null;
  optionDistribution: Record<string, number>;

  setQuizState: (state: QuizState) => void;
  setCurrentQuestion: (question: Question | null) => void;
  setTimeRemaining: (time: number) => void;
  setHasAnswered: (answered: boolean) => void;
  setSelectedAnswer: (answer: string | null) => void;
  setIsHost: (host: boolean) => void;
  setSessionId: (id: string | null) => void;
  setSocket: (socket: Socket | null) => void;
  setMyParticipantId: (id: string | null) => void;
  setQuestionTotal: (questionTotal: number) => void;
  setQuestionIndex: (questionIndex: number) => void;
  setCurrentRanking: (ranking: ParticipantRanking[]) => void;
  setQuestionResult: (result: QuestionResult | null) => void;
  setQuestionFinalResults: (result: QuestionResult[] | null) => void;
  setOptionDistribution: (distribution: Record<string, number>) => void;

  submitAnswer: (answer: string) => void;
  setShowResults: (showResults: boolean) => void;
  startQuiz: () => void; // ホストのみ
  nextQuestion: () => void; // ホストのみ
}

const useQuizStore = create<QuizStore>((set, get) => ({
  quizState: QUIZ_STATES.WAITING,
  currentQuestion: null,
  timeRemaining: 0,
  hasAnswered: false,
  selectedAnswer: null,
  isHost: false,
  sessionId: null,
  socket: null,
  myParticipantId: null,
  questionTotal: 0,
  questionIndex: 0,
  currentRanking: [],
  showResults: false,
  questionResult: null,
  questionFinalResults: null,
  optionDistribution: {},

  setQuizState: (state) => set({ quizState: state }),
  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  setHasAnswered: (answered) => set({ hasAnswered: answered }),
  setSelectedAnswer: (answer) => set({ selectedAnswer: answer }),
  setIsHost: (host) => set({ isHost: host }),
  setSessionId: (id) => set({ sessionId: id }),
  setSocket: (socket) => set({ socket: socket }),
  setMyParticipantId: (id) => set({ myParticipantId: id }),
  setQuestionTotal: (total) => set({ questionTotal: total }), // 追加: 質問の合計数を設定する関数
  setQuestionIndex: (index) => set({ questionIndex: index }), // 追加: 質問のインデックスを設定する関数
  setCurrentRanking: (currentRanking) => set({ currentRanking }),
  setQuestionResult: (result) => set({ questionResult: result }),
  setQuestionFinalResults: (result) => set({ questionFinalResults: result }),
  setOptionDistribution: (distribution) => set({ optionDistribution: distribution }),

  submitAnswer: (answer: string) => {
    const { socket, currentQuestion, hasAnswered, quizState, sessionId, myParticipantId } = get();
    if (!socket || !currentQuestion || hasAnswered || quizState !== QUIZ_STATES.ACTIVE) return;

    socket.emit(webSocketAppEvents.QUIZ_SUBMIT_ANSWER, {
      sessionId,
      questionId: currentQuestion.id,
      answer,
      participantId: myParticipantId,
    });

    set({ hasAnswered: true, selectedAnswer: answer });
  },

  setShowResults(showResults) {
    const { socket, sessionId, currentQuestion } = get();
    if (!socket || !sessionId || !currentQuestion) return;
    set({ showResults });
    if (!showResults) return;
    socket.emit(webSocketAppEvents.QUIZ_SHOW_RESULTS, {
      showResults,
      sessionId,
      questionId: currentQuestion?.id,
    });
  },

  startQuiz: () => {
    const { socket, sessionId, isHost } = get();
    if (!socket || !isHost || !sessionId) return;
    socket.emit(webSocketAppEvents.QUIZ_START_REQUEST, { sessionId });
  },

  nextQuestion: () => {
    const { socket, sessionId, isHost } = get();
    if (!socket || !isHost || !sessionId) return;
    socket.emit(webSocketAppEvents.QUIZ_NEXT_QUESTION, { sessionId });
  },
}));

// ドメインロジックを分離するクラス
class QuizDomain {
  private quizStore: StoreApi<QuizStore>;

  constructor(quizStore: StoreApi<QuizStore>) {
    this.quizStore = quizStore;
  }

  handleCurrentRanking(ranking: ParticipantRanking[], questionResult: QuestionResult) {
    const { setCurrentRanking, setQuestionResult, setQuizState } = this.quizStore.getState();
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log("Current ranking event received", ranking);
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log("Question result event received", questionResult);
    // ストアの状態を更新
    setCurrentRanking(ranking);
    setQuestionResult(questionResult);
    // クイズの状態を更新
    setQuizState(QUIZ_STATES.RESULTS);
  }

  handleQuizComplete(data: {
    ended: boolean;
    sessionId: string;
    questionResults: QuestionResult[];
    participantRanking: ParticipantRanking[];
  }) {
    const { ended, questionResults, participantRanking } = data;

    if (!ended) return;
    const { setCurrentRanking, setQuestionFinalResults, setQuizState } = this.quizStore.getState();

    setCurrentRanking(participantRanking);
    setQuestionFinalResults(questionResults);
    setQuizState(QUIZ_STATES.COMPLETED);
  }
}
import type { AnsweredParticipant } from "@/types/Participant";
import type { ParticipantRanking, QuestionResult } from "@/types/Result";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function QuizProvider({
  children,
  sessionId,
  isHost = false,
}: {
  children: ReactNode;
  sessionId: string;
  isHost?: boolean;
}) {
  const router = useRouter();
  const { socket } = useWebSocket();
  const quizStore = useQuizStore;
  // useRefを使ってquizDomainをレンダリング間で保持する
  const quizDomainRef = useRef<QuizDomain | null>(null);
  const { setSocket, setSessionId, setIsHost, setMyParticipantId } = useQuizStore();
  const { myParticipantId, setAnsweredParticipantsCount, setAnsweredParticipants } =
    useParticipantStore();

  // 初回レンダリング時にのみQuizDomainを作成
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    quizDomainRef.current = new QuizDomain(quizStore);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    // 必要なステート更新
    setSocket(socket);
    setSessionId(sessionId);
    setIsHost(isHost);
    setMyParticipantId(myParticipantId);

    if (!socket || !quizDomainRef.current) return;

    const quizDomain = quizDomainRef.current;

    const handleQuestionDisplay = (data: {
      question: Question;
      questionIndex: number;
      timeLimit: number;
      questionTotal: number;
    }) => {
      const {
        setQuizState,
        setCurrentQuestion,
        setTimeRemaining,
        setHasAnswered,
        setSelectedAnswer,
        setQuestionTotal,
        setQuestionIndex,
        setShowResults,
      } = quizStore.getState();

      const { question, questionIndex, timeLimit, questionTotal } = data;
      const stopTimer = setupTimerWithRaf();

      setCurrentQuestion(question);
      setTimeRemaining(timeLimit);
      setQuizState(QUIZ_STATES.ACTIVE);
      setHasAnswered(false);
      setSelectedAnswer(null);
      setQuestionTotal(questionTotal);
      setQuestionIndex(questionIndex);
      setAnsweredParticipantsCount(0);
      setAnsweredParticipants([]);
      setShowResults(false);

      return () => {
        stopTimer(); // クリーンアップ
      };
    };

    const setupTimerWithRaf = () => {
      // 前回の時間を記録
      let lastTime = performance.now();
      let accumulatedTime = 0;
      let animationFrameId: number | null = null;

      const startTimer = () => {
        const animate = (now: number) => {
          // 現在のステートを取得（毎フレーム最新の状態を取得）
          const { timeRemaining, quizState, setTimeRemaining } = quizStore.getState();

          // // 全員が結果表示の場合はタイマーを停止
          if (quizState === QUIZ_STATES.RESULTS) {
            cancelAnimationFrame(animationFrameId || 0);
            return;
          }

          // 経過時間を計算 (ミリ秒)
          const deltaTime = now - lastTime;
          lastTime = now;

          // 累積時間に加算
          accumulatedTime += deltaTime;

          // 1秒経過したらカウントダウン
          if (accumulatedTime >= 1000) {
            if (timeRemaining > 0) {
              setTimeRemaining(timeRemaining - 1);
            } else {
              // タイムアップ時の処理
              cancelAnimationFrame(animationFrameId || 0);
              return;
            }

            // 余りの時間を保持
            accumulatedTime -= 1000;
          }

          animationFrameId = requestAnimationFrame(animate);
        };

        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(animate);

        return () => {
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
          }
        };
      };

      return startTimer();
    };

    // イベントハンドラを定義
    const handleQuizStart = (data: {
      question: Question;
      questionIndex: number;
      timeLimit: number;
      questionTotal: number;
    }) => {
      const { setTimeRemaining, setCurrentRanking } = quizStore.getState();

      const { question, questionIndex, timeLimit, questionTotal } = data;
      setTimeRemaining(0); // Reset time remaining
      setCurrentRanking([]); // Reset ranking

      handleQuestionDisplay({
        question: question,
        timeLimit: timeLimit,
        questionTotal,
        questionIndex,
      });
    };

    const handleNextQuestion = (data: {
      question: Question;
      questionIndex: number;
      questionTotal: number;
      timeLimit: number;
    }) => {
      const { question, questionIndex, questionTotal, timeLimit } = data;
      return handleQuestionDisplay({
        question,
        questionIndex,
        questionTotal,
        timeLimit,
      });
    };

    const handleQuestionResults = (data: {
      participantRanking: ParticipantRanking[];
      questionResult: QuestionResult;
    }) => {
      const { participantRanking, questionResult } = data;
      quizDomain.handleCurrentRanking(participantRanking, questionResult);
    };

    const handleQuizComplete = (data: {
      ended: boolean;
      sessionId: string;
      questionResults: QuestionResult[];
      participantRanking: ParticipantRanking[];
    }) => {
      quizDomain.handleQuizComplete(data);
    };

    const handleAnswerResultToParticipants = (data: {
      answeredParticipantCount: number;
      optionDistribution: Record<string, number>;
    }) => {
      const { setOptionDistribution } = quizStore.getState();
      const { answeredParticipantCount, optionDistribution } = data;
      setAnsweredParticipantsCount(answeredParticipantCount);
      setOptionDistribution(optionDistribution);
    };

    const handleAnswerResultToHost = (data: {
      participantId: string;
      answer: string;
      isCorrect: boolean;
      answeredParticipantCount: number;
    }) => {
      const { answeredParticipantCount, participantId, answer, isCorrect } = data;
      setAnsweredParticipantsCount(answeredParticipantCount);
      setAnsweredParticipants((prev: AnsweredParticipant[]) => {
        const existingParticipant = prev.find((p) => p.participantId === participantId);
        if (existingParticipant) {
          return prev.map((p) =>
            p.participantId === participantId ? { ...p, answer, isCorrect } : p,
          );
        }
        return [...prev, { participantId, answer, isCorrect } as AnsweredParticipant];
      });
    };

    // WebSocketイベントリスナーの登録
    socket.on(webSocketAppEvents.QUIZ_STARTED, handleQuizStart);
    socket.on(webSocketAppEvents.ANSWER_RESULT_TO_HOST, handleAnswerResultToHost);
    socket.on(webSocketAppEvents.ANSWER_RESULT_TO_PARTICIPANTS, handleAnswerResultToParticipants);
    socket.on(webSocketAppEvents.QUIZ_QUESTION_UPDATE, handleNextQuestion);
    socket.on(webSocketAppEvents.QUIZ_QUESTION_RESULT, handleQuestionResults);
    socket.on(webSocketAppEvents.QUIZ_END, handleQuizComplete);
    // 接続されているすべてのクライアントにクリーンアップを通知
    socket.on(webSocketAppEvents.SESSION_CLEANUP_DONE, () => {
      setSessionId(null);
      setIsHost(false);
      setMyParticipantId(null);
      router.push("/");
    });

    if (sessionId) {
      // セッションの初期データ取得
      socket.emit(webSocketAppEvents.SESSION_DATA, { sessionId });
    }

    // クリーンアップ
    return () => {
      if (socket) {
        socket.off(webSocketAppEvents.QUIZ_STARTED, handleQuizStart);
        socket.off(webSocketAppEvents.ANSWER_RESULT_TO_HOST, handleAnswerResultToHost);
        socket.off(
          webSocketAppEvents.ANSWER_RESULT_TO_PARTICIPANTS,
          handleAnswerResultToParticipants,
        );
        socket.off(webSocketAppEvents.QUIZ_QUESTION_UPDATE, handleNextQuestion);

        socket.off(webSocketAppEvents.QUIZ_QUESTION_RESULT, handleQuestionResults);
        socket.off(webSocketAppEvents.QUIZ_END, handleQuizComplete);
      }
    };
  }, [
    socket,
    sessionId,
    isHost,
    setSocket,
    setSessionId,
    setIsHost,
    setMyParticipantId,
    myParticipantId,
  ]);

  return <>{children}</>;
}

// biome-ignore lint/nursery/useComponentExportOnlyModules: <explanation>
export const useQuiz = () => {
  const {
    quizState,
    setQuizState,
    currentQuestion,
    timeRemaining,
    hasAnswered,
    selectedAnswer,
    submitAnswer,
    startQuiz,
    nextQuestion,
    isHost,
    questionTotal,
    questionIndex,
    currentRanking,
    setCurrentRanking,
    showResults,
    setShowResults,
    questionResult,
    optionDistribution,
  } = useQuizStore();

  return {
    quizState,
    setQuizState,
    currentQuestion,
    timeRemaining,
    hasAnswered,
    selectedAnswer,
    submitAnswer,
    startQuiz,
    nextQuestion,
    isHost,
    questionTotal,
    questionIndex,
    currentRanking,
    setCurrentRanking,
    showResults,
    setShowResults,
    questionResult,
    optionDistribution,
  };
};
