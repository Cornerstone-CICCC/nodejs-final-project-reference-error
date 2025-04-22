import AnswerPushButton from "@/components/pages/sessions/AnswerPushButton";
import { QUIZ_STATES } from "@/constants/quizState";
import { useQuiz } from "@/stores/quizStore";
import type { Question } from "@/types/Question";

type AnswerButtonsProps = {
  question: Question;
  onAnswer: (optionId: string) => void;
  isAnswered: boolean;
};

export function AnswerButtons({ question, onAnswer }: AnswerButtonsProps) {
  const {
    currentQuestion,
    submitAnswer,
    hasAnswered,
    selectedAnswer,
    quizState,
    optionDistribution,
  } = useQuiz();

  const showResults = quizState === QUIZ_STATES.RESULTS;
  const isDisabled = hasAnswered || selectedAnswer !== null;

  const handleOptionClick = (text: string) => {
    if (!isDisabled && !showResults) {
      submitAnswer(text);
      onAnswer(text);
    }
  };

  return (
    <div className="w-full grid grid-cols-2 gap-x-2 gap-y-3">
      {currentQuestion?.options.map((text, index) => {
        const isSelected = selectedAnswer === text;
        const isCorrect = question.correctOption === text;
        const count = optionDistribution[text] ?? 0;

        return (
          <AnswerPushButton
            key={text}
            index={index}
            text={text}
            onClick={() => handleOptionClick(text)}
            disabled={isDisabled}
            isSelected={isSelected}
            showResults={showResults}
            isCorrect={isCorrect}
            distributionCount={count}
          />
        );
      })}
    </div>
  );
}

export default AnswerButtons;
