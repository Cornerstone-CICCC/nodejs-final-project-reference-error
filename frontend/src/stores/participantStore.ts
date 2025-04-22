import type { AnsweredParticipant, Participant } from "@/types/Participant";
import { create } from "zustand";

// ローカルストレージのキー
const PARTICIPANT_ID_KEY = "quiz_participant_id";
const SESSION_ID_KEY = "quiz_session_id";

type ParticipantState = {
  participants: Participant[];
  sessionId: string | null;
  myParticipantId: string | null;
  answeredParticipantsCount: number;
  answeredParticipants: AnsweredParticipant[];

  // アクション
  setParticipants: (participants: Participant[]) => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (participantId: string) => void;
  setSessionId: (sessionId: string) => void;
  setMyParticipantId: (participantId: string) => void;
  setAnsweredParticipantsCount: (count: number) => void;
  setAnsweredParticipants: (
    updater: AnsweredParticipant[] | ((prev: AnsweredParticipant[]) => AnsweredParticipant[]),
  ) => void;
  clearAll: () => void;
};

// ローカルストレージから初期値を取得
const getInitialState = () => {
  if (typeof window === "undefined") {
    return {
      myParticipantId: null,
      sessionId: null,
    };
  }

  return {
    myParticipantId: sessionStorage.getItem(PARTICIPANT_ID_KEY),
    sessionId: sessionStorage.getItem(SESSION_ID_KEY),
  };
};

const initialState = getInitialState();

export const useParticipantStore = create<ParticipantState>((set) => ({
  participants: [],
  sessionId: initialState.sessionId,
  myParticipantId: initialState.myParticipantId,
  answeredParticipantsCount: 0,
  answeredParticipants: [],

  setParticipants: (participants) => set({ participants }),

  addParticipant: (participant) =>
    set((state) => {
      // 重複チェック
      if (state.participants.some((p) => p.id === participant.id)) {
        return state;
      }
      return { participants: [...state.participants, participant] };
    }),

  removeParticipant: (participantId) =>
    set((state) => ({
      participants: state.participants.filter((p) => p.id !== participantId),
    })),

  setSessionId: (sessionId) => {
    // sessionStorage に保存
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return set({ sessionId });
  },

  setMyParticipantId: (participantId) => {
    // sessionStorage に保存
    if (typeof window !== "undefined") {
      sessionStorage.setItem(PARTICIPANT_ID_KEY, participantId);
    }
    return set({ myParticipantId: participantId });
  },

  setAnsweredParticipantsCount: (count) => set({ answeredParticipantsCount: count }),

  setAnsweredParticipants: (updater) =>
    set((state) => {
      const newAnsweredParticipants =
        typeof updater === "function" ? updater(state.answeredParticipants) : updater;
      return { answeredParticipants: newAnsweredParticipants };
    }),

  clearAll: () => {
    // sessionStorage からも削除
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(PARTICIPANT_ID_KEY);
      sessionStorage.removeItem(SESSION_ID_KEY);
    }
    return set({ participants: [], sessionId: null, myParticipantId: null });
  },
}));
