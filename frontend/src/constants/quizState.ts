export const QUIZ_STATES = {
    WAITING: 'waiting',       // waiting for participants
    ACTIVE: 'active',         // progressing
    RESULTS: 'results',       // quiz results
    COMPLETED: 'completed',   // quiz completed
  } as const;
  
  export type QuizState = typeof QUIZ_STATES[keyof typeof QUIZ_STATES];