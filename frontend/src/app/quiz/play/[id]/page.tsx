"use client";

import { useState, useEffect } from 'react';
// import { useRouter } from 'next/router';
import { WaitingRoom } from '@/components/pages/quiz/WaitingRoom';
import { QuestionDisplay } from '@/components/pages/quiz/QuestionDisplay';
import { ResultsDisplay } from '@/components/pages/quiz/ResultsDisplay';

type RoomState = 'waiting' | 'quiz' | 'results';

interface Option {
    id: string;
    text: string;
}

interface Question {
    text: string;
    options: Option[];
    timeLimit: number;
    isAnswered: boolean;
    correctOptionId?: string;
    showResults: boolean;
    answerDistribution?: Record<string, number>;
}

interface Participant {
    id: string;
    name: string;
    avatar: string;
    isHost: boolean;
}

interface QuizResult {
    id: string;
    name: string;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    averageTime: number;
}

export default function RoomPage() {
    // const router = useRouter();
    // const { roomId } = router.query;
    const [roomState, setRoomState] = useState<RoomState>('waiting');
    const [isHost, setIsHost] = useState(false);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [results, setResults] = useState<QuizResult[] | null>(null);

    // TODO demo
    const sampleQuestion: Question = {
        text: "What is the capital of France?",
        options: [
            { id: "a", text: "London" },
            { id: "b", text: "Paris" },
            { id: "c", text: "Berlin" },
            { id: "d", text: "Madrid" },
        ],
        timeLimit: 30, // seconds
        isAnswered: false,
        correctOptionId: "b",
        showResults: false,
        answerDistribution: {},
    };


    //TODO demo
    const demoParticipants: Participant[] = [
        {
            id: "user123",
            name: "Alice Smith",
            avatar: "https://example.com/avatars/alice.jpg",
            isHost: true,
        },
        {
            id: "user456",
            name: "Bob Johnson",
            avatar: "https://example.com/avatars/bob.png",
            isHost: false,
        },
    ];


    const roomId = "1";
    useEffect(() => {
        if (!roomId) return;
        // TODO demo
        setCurrentQuestion(sampleQuestion)
        setParticipants(demoParticipants)
    }, [roomId]);

    const handleStartQuiz = () => {
        // TODO: Implement quiz start logic
        setRoomState('quiz');
    };

    const handleAnswer = (optionId: string) => {
        // TODO: Implement answer submission logic
    };

    const renderContent = () => {
        switch (roomState) {
            case 'waiting':
                return (
                    <WaitingRoom
                        roomNumber={roomId as string}
                        participants={participants}
                        // isHost={isHost}
                        isHost={true}
                        onStartQuiz={handleStartQuiz}
                    />
                );
            case 'quiz':
                return currentQuestion ? (
                    <QuestionDisplay
                        question={currentQuestion.text}
                        options={currentQuestion.options}
                        timeLimit={currentQuestion.timeLimit}
                        onAnswer={handleAnswer}
                        isAnswered={currentQuestion.isAnswered}
                        correctOptionId={currentQuestion.correctOptionId}
                        showResults={currentQuestion.showResults}
                        answerDistribution={currentQuestion.answerDistribution}
                    />
                ) : null;
            case 'results':
                return results ? (
                    <ResultsDisplay
                        results={results}
                        currentPlayerId="current-user-id" // TODO: Replace with actual user ID
                    />
                ) : null;
            default:
                return null;
        }
    };

    if (!roomId) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {renderContent()}
        </div>
    );
} 