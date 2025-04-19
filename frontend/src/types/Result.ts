export type Result = {
  participantRanking: ParticipantRanking[];
  questionResults: Record<string, QuestionResult>;
};

export type ParticipantRanking = {
  id: string;
  name: string;
  score: number;
  rank: number;
};

export type QuestionResult = {
  correctAnswers: number;
  wrongAnswers: number;
  optionDistribution: Record<string, number>;
};
