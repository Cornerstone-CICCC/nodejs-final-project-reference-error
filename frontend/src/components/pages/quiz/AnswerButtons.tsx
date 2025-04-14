import { useState } from 'react';
import { PushButton } from "@/components/ui/PushButton";

interface Option {
    id: string;
    text: string;
}

interface AnswerButtonProps {
    options: Option[];
    onAnswer: (optionId: string) => void;
    isAnswered: boolean;
    correctOptionId?: string;
    showResults: boolean;
    answerDistribution?: Record<string, number>;
}

export const AnswerButton = ({
    options,
    onAnswer,
    isAnswered,
    correctOptionId,
    showResults,
    answerDistribution = {},
}: AnswerButtonProps) => {
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

    const buttonColorMap: Record<string, string> = {
        "1": "red",
        "2": "blue",
        "3": "yellow",
        "4": "green"
    }

    const handleOptionClick = (optionId: string) => {
        if (!isAnswered && !selectedOptionId) {
            setSelectedOptionId(optionId);
            onAnswer(optionId);
        }
    };

    const getButtonColor = (optionId: string) => {
        if (!showResults) {
            return buttonColorMap[optionId];
        }
        return optionId === correctOptionId ? "green" : "red";
    };

    return (
        <div className="grid grid-cols-2 gap-4">
            {options.map((option) => (
                <div key={option.id} className="flex flex-col items-center">
                    <PushButton
                        color={getButtonColor(option.id) as "lime" | "blue" | "red" | "green"}
                        size="lg"
                        rounded="md"
                        width='full'
                        onClick={() => handleOptionClick(option.id)}
                        disabled={isAnswered || selectedOptionId !== null}
                        className={`disabled:cursor-not-allowed ${selectedOptionId === option.id ? "translate-y-[4px]" : ""}`}
                    >
                        {option.text}
                    </PushButton>
                    {showResults && answerDistribution[option.id] !== undefined && (
                        <span className="mt-2 text-sm text-gray-600">
                            {answerDistribution[option.id]} people
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
};