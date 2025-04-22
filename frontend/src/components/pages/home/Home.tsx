"use client";
import { CreateRoomModal } from "@/components/shared/CreateRoomModal";
import { Header } from "@/components/shared/Header";
import { QuizBanner } from "@/components/shared/QuizBanner";
import { QuizCard } from "@/components/shared/QuizCard";
import { skeletonListPlaceholder } from "@/components/ui/SkeltonListPlaceHolder";
import type { Quiz } from "@/types/Quiz";
import type { CreateRoom } from "@/types/Room";
import { getAllQuizzes } from "@/usecases/question/getAllQuizUsecase";
import { createRoom } from "@/usecases/room/createRoomUsecase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function Home() {
  const router = useRouter();
  const [playQuizId, setPlayQuizId] = useState<string | null>(null);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);

  const handlePlayQuiz = (quizId: string) => {
    setPlayQuizId(quizId);
    setShowCreateRoomModal(true);
  };

  const handleCreateRoom = async (roomConfig: CreateRoom) => {
    setIsSubmitting(true);
    createRoom(roomConfig)
      .then((res) => {
        const { roomCode, sessionId } = res.data.room;
        router.push(`/rooms/${roomCode}/${sessionId}/host/`);
      })
      .catch((err) => {
        console.error("Failed to create the room:", err);
        alert("Failed to create the room. Please try again.");
      })
      .finally(() => {
        setIsSubmitting(false);
        setShowCreateRoomModal(false);
        setPlayQuizId(null);
      });
  };

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const getQuizzes = async () => {
      setIsLoading(true);
      try {
        const data = await getAllQuizzes();
        setQuizzes(data);
      } catch {
        setError("Failed to fetch quizzes");
      } finally {
        setIsLoading(false);
      }
    };
    getQuizzes();
  }, []);

  const role = "teacher"; // or "user

  return (
    <>
      <Header username="username" avatarImage="koala" />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">🎉 Hello username!</h1>
        <QuizBanner
          onCreateRoom={() => {
            if (role === "teacher") {
              setPlayQuizId(null);
              setShowCreateRoomModal(true);
            } else {
              router.push("/quiz/");
            }
          }}
          buttonText={role === "teacher" ? "Create Room" : "Join Room"}
        />
        {role === "teacher" && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-4">Popular Quizzes</h2>

            {isLoading && skeletonListPlaceholder({ count: 4 })}

            {error && <p className="text-red-500">{error}</p>}

            {!isLoading && !error && (
              <div className="space-y-4">
                {quizzes.map((quiz) => (
                  <QuizCard
                    key={quiz.id}
                    id={quiz.id}
                    title={quiz.title}
                    category={quiz.category}
                    createdAt={new Date(quiz.createdAt).toLocaleDateString()}
                    setPlayQuizId={handlePlayQuiz}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {showCreateRoomModal && role === "teacher" && (
          <CreateRoomModal
            isOpen={showCreateRoomModal}
            onClose={() => setShowCreateRoomModal(false)}
            onCreateRoom={handleCreateRoom}
            selectedQuizId={playQuizId}
            availableQuizzes={quizzes}
            isSubmitting={isSubmitting}
          />
        )}
        <div className="p-4">
          <h1 className="text-xl font-semibold mb-4">Question Image</h1>
        </div>
      </div>
    </>
  );
}
