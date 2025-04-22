export type UserActivityLog = {
  id: string;
  userId: string;
  lastActivityDate: string;
  questionsAnswered: number;
  correctAnswers: number;
  sessionsJoined: number;
};

export type CreateUserActivityLog = {
  userId: string;
  questionsAnswered: number;
  correctAnswers: number;
};
