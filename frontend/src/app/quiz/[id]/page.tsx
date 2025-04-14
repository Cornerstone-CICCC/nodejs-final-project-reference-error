"use client";

import { useState } from "react";
import { Button } from "flowbite-react";
import { CreateRoomModal } from "@/components/pages/quiz/CreateRoomModal";
import Image from "next/image";

interface Question {
  id: number;
  question: string;
  icon: string;
  options: { text: string; isCorrect: boolean }[];
}

// demo
const questions: Question[] = [
  {
    id: 1,
    question: "Do you get to school by bus?",
    icon: "/assets/quiz/school/school-pic.jpg",
    options: [
      { text: "Yes", isCorrect: true },
      { text: "No", isCorrect: false },
      { text: "Sometimes", isCorrect: false },
      { text: "Never", isCorrect: false },
    ],
  },
  {
    id: 2,
    question: "This is a book?",
    icon: "/assets/quiz/school/school-pic.jpg",
    options: [
      { text: "True", isCorrect: true },
      { text: "False", isCorrect: false },
      { text: "Maybe", isCorrect: false },
      { text: "Not sure", isCorrect: false },
    ],
  },
];

export default function QuizDetailPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const handleCreateRoom = (roomData: any) => {
    // TODO:logic
    window.location.href = `/quiz/play/1`;
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto bg-white">
        {/* Header */}
        <div className="relative h-48 bg-gray-100">
          <Image
            src="/assets/quiz/school/school-pic.jpg"
            alt="Back to School"
            fill
            className="object-cover"
          />
        </div>

        {/* Quiz Info */}
        <div className="p-6">
          <div className="mb-10">
            <h1 className="text-2xl font-bold mb-4">Back to School Quiz Game</h1>
            <p>
              Test your knowledge with this fun and engaging quiz!
            </p>
            {/* Action Buttons */}
            <div className="flex space-x-4 mt-6">
              <Button
                color="blue"
                size="lg"
                className="w-full"
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create Room
              </Button>
            </div>
          </div>

          {/* Question List */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-medium">Questions ({questions.length})</h2>
              <button
                className="text-blue-600 text-sm"
                onClick={() => setIsAccordionOpen(!isAccordionOpen)}
              >
                {isAccordionOpen ? "Hide all answers" : "View answers"}
              </button>
            </div>
            <div className={`space-y-4`}>
              {questions.map((question) => (
                <div key={question.id}>
                  <div className="flex items-center space-x-4 rounded-lg bg-gray-50">
                    <Image
                      src={question.icon}
                      alt={`Question ${question.id}`}
                      width={200}
                      height={200}
                      className="rounded-s-lg"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-1">Question {question.id}</div>
                      <div className="font-medium">{question.question}</div>
                    </div>
                  </div>
                  <div className={`${isAccordionOpen ? "block" : "hidden"} mt-4 space-y-2`}>
                    {question.options.map((option, index) => (
                      <div
                        key={index}
                        className={`px-4 p-2 rounded-lg ${option.isCorrect ? "bg-green-100" : "bg-red-100"
                          }`}
                      >
                        {option.text}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateRoom={handleCreateRoom}
        selectedQuizId="1"
      />
    </div>
  );
}