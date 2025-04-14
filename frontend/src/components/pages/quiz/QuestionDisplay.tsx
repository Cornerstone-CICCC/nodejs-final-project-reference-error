import { useState, useEffect } from 'react';
import { Card, Button } from 'flowbite-react';
import { Timer } from './Timer';
import { AnswerButton } from "@/components/pages/quiz/AnswerButtons"

interface Option {
    id: string;
    text: string;
}

interface QuestionDisplayProps {
    question: string;
    options: Option[];
    timeLimit: number;
    onAnswer: (optionId: string) => void;
    isAnswered: boolean;
    correctOptionId?: string;
    showResults: boolean;
    answerDistribution?: Record<string, number>;
}

export const QuestionDisplay = ({
    question,
    options,
    timeLimit,
    onAnswer,
    isAnswered,
    correctOptionId,
    showResults,
    answerDistribution = {},
}: QuestionDisplayProps) => {
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [timeExpired, setTimeExpired] = useState(false);

    useEffect(() => {
        setSelectedOptionId(null);
        setTimeExpired(false);
    }, [question]);

    const handleOptionClick = (optionId: string) => {
        if (!isAnswered && !timeExpired) {
            setSelectedOptionId(optionId);
            onAnswer(optionId);
        }
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <div className="mb-6">
                <Timer
                    duration={timeLimit}
                    onExpire={() => setTimeExpired(true)}
                    isActive={!isAnswered && !showResults}
                />
            </div>

            <h2 className="text-xl font-bold mb-6">{question}</h2>

            <div className="space-y-3">
                <AnswerButton
                    options={[
                        { id: "1", text: "Option A" },
                        { id: "2", text: "Option B" },
                        { id: "3", text: "Option C" },
                        { id: "4", text: "Option D" }
                    ]}
                    onAnswer={(optionId) => console.log(optionId)}
                    isAnswered={false}
                    showResults={false}
                />
            </div>

            {(isAnswered || timeExpired) && !showResults && (
                <div className="text-center mt-6 text-gray-600">
                    Waiting for other participants to answer...
                </div>
            )}
        </Card>
    );
}; 