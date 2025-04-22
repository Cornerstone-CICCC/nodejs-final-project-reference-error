import type { AvatarOption } from "@/constants/Avatar";

export type Participant = {
  id: string;
  name: string;
  avatar: AvatarOption;
  isGuest: boolean;
  score: number;
  answeredQuestions: string[];
  isOnline: boolean;
  isHost?: boolean;
  joinedAt: number;
  lastActive: number;
};

export type AnsweredParticipant = {
  participantId: string;
  answer: string;
  isCorrect: boolean;
};
