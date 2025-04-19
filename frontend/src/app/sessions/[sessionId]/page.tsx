"use client";
import { QuestionDisplay } from "@/components/pages/sessions/QuestionDisplay";
import { ResultsDisplay } from "@/components/pages/sessions/ResultsDisplay";
import { FullHeightCardLayout } from "@/components/ui/FullHeightCardLayout";
import type { Participant } from "@/types/Participant";
import type { Question } from "@/types/Question";
import { useEffect, useState } from "react";

type RoomState = "waiting" | "quiz" | "results";

// TODO demo
const sampleQuestion: Question = {
  id: "q1",
  text: "What is the capital of France?",
  options: ["London", "Paris", "Berlin", "Madrid"],
  correctOption: "Paris",
  points: 10,
  timeLimit: 30, // seconds
  status: "waiting", // Assuming "unanswered" is a valid QuestionStatus
};

//TODO demo
const demoParticipants: Participant[] = [
  {
    id: "user123",
    name: "Alice Smith",
    avatar: "https://example.com/avatars/alice.jpg",
  },
  {
    id: "user456",
    name: "Bob Johnson",
    avatar: "https://example.com/avatars/bob.png",
  },
];
const demoResults: Result = {
  participantRanking: [
    {
      id: "user123",
      name: "Alice Smith",
      score: 30,
      rank: 1,
    },
    {
      id: "user456",
      name: "Bob Johnson",
      score: 20,
      rank: 2,
    },
  ],
  questionResults: {
    q1: {
      correctAnswers: 1,
      wrongAnswers: 1,
      optionDistribution: {
        london: 0,
        paris: 1,
        berlin: 1,
        madrid: 0,
      },
    },
  },
};

export default function SessionPage() {
  const [roomState, setRoomState] = useState<RoomState>("waiting");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [results, setResults] = useState<QuizResult[] | null>(null);

  useEffect(() => {
    if (!roomId) return;
    // TODO demo
    setCurrentQuestion(sampleQuestion);
    setParticipants(demoParticipants);
  }, [roomId]);

  const startQuiz = () => {
    // TODO: Implement quiz start logic
    setRoomState("quiz");
  };

  const handleAnswer = (optionId: string) => {
    // TODO: Implement answer submission logic
  };

  return (
    <FullHeightCardLayout useWithHeader={false}>
      {roomState === "waiting" ? (
        <WaitingRoom
          roomNumber={roomId as string}
          participants={participants}
          isHost={true}
          onStartQuiz={handleStartQuiz}
        />
      ) : roomState === "quiz" ? (
        <QuestionDisplay
          question={currentQuestion?.text}
          options={currentQuestion?.options}
          timeLimit={currentQuestion?.timeLimit}
          onAnswer={handleAnswer}
          isAnswered={currentQuestion?.isAnswered}
          correctOptionId={currentQuestion?.correctOptionId}
          showResults={currentQuestion?.showResults}
          answerDistribution={currentQuestion?.answerDistribution}
        />
      ) : (
        <ResultsDisplay
          results={results as QuizResult[]}
          currentPlayerId="current-user-id" // TODO: Replace with actual user ID
        />
      )}
    </FullHeightCardLayout>
  );
}
