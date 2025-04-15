"use client";
import { CreateRoomModal } from "@/components/pages/quiz/CreateRoomModal";
import { QuizBanner } from "@/components/shared/QuizBanner";
import { QuizListCard } from "@/components/shared/QuizListCard";
import { useState } from "react";

export default function Home() {
  const [playQuizId, setPlayQuizId] = useState<string | null>(null);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);

  const handlePlayQuiz = (quizId: string) => {
    setPlayQuizId(quizId);
    setShowCreateRoomModal(true);
  };

  const handleCreateRoom = (roomData: {
    allowGuests: boolean;
    selectedQuizId: string;
    timeLimit: number;
    participantLimit: number;
  }) => {
    // TODO: logic
    console.log("Creating room with data:", roomData);
  };

  // TODO demo
  const quizzes = [
    {
      quizId: "1",
      title: "Basic Algebra",
      description: "Learn the fundamentals of algebra, including variables and equations.",
    },
    {
      quizId: "2",
      title: "Geometry Basics",
      description: "Understand shapes, angles, and theorems in geometry.",
    },
    {
      quizId: "3",
      title: "Introduction to Calculus",
      description: "Explore limits, derivatives, and integrals in calculus.",
    },
    {
      quizId: "4",
      title: "Statistics 101",
      description: "Get started with data analysis, probability, and statistics.",
    },
    {
      quizId: "5",
      title: "Physics Fundamentals",
      description: "Dive into the basics of motion, forces, and energy.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🎉 Hello username!</h1>
      <QuizBanner onCreateRoom={() => setShowCreateRoomModal(true)} />
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Popular Quizzes</h2>
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <QuizListCard
              key={quiz.quizId}
              quizId={quiz.quizId}
              title={quiz.title}
              description={quiz.description}
              setPlayQuizId={handlePlayQuiz}
            />
          ))}
        </div>
      </div>
      {showCreateRoomModal && playQuizId && (
        <CreateRoomModal
          isOpen={showCreateRoomModal}
          onClose={() => setShowCreateRoomModal(false)}
          onCreateRoom={handleCreateRoom}
          selectedQuizId={playQuizId}
        />
      )}
    </div>
  );
}
