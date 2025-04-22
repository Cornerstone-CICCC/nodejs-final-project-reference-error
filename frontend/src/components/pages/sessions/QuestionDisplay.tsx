import { AnswerButtons } from "@/components/pages/sessions/AnswerButtons";
import { RankingModal } from "@/components/pages/sessions/RankingModal";
import { QUIZ_STATES } from "@/constants/quizState";
import { useQuiz } from "@/stores/quizStore";
import type { Question } from "@/types/Question";
import type { QuestionResult } from "@/types/Result";
import { useCallback, useState } from "react";
import { TimerContainer } from "./Timer";

type QuestionDisplayProps = {
  question: Question;
  questionResult: QuestionResult | null;
  unansweredCount: number;
};

export function QuestionDisplay({
  question,
  questionResult,
  unansweredCount,
}: QuestionDisplayProps) {
  const {
    quizState,
    setQuizState,
    questionTotal,
    submitAnswer,
    hasAnswered,
    showResults,
    setShowResults,
  } = useQuiz();
  const [showRankingModal, setShowRankingModal] = useState<boolean>(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const handleTimeExpire = useCallback(() => {
    setQuizState(QUIZ_STATES.RESULTS);

    setTimeout(() => {
      setShowRankingModal(true);
      setShowResults(true);
    }, 3000);
  }, []);

  const handleOptionClick = async (optionId: string) => {
    if (!hasAnswered && !showResults) {
      submitAnswer(optionId);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-full mt-2 mb-6">
          <TimerContainer showResults={showResults} onTimeExpire={handleTimeExpire} />
        </div>
        <h2 className="grow text-xl font-bold mt-2 mb-6 text-center">{question.questionText}</h2>
        <AnswerButtons
          question={question}
          onAnswer={(optionId) => {
            handleOptionClick(optionId);
          }}
          isAnswered={hasAnswered}
          questionResult={questionResult}
        />
        <div className="mt-6 text-sm text-gray-500 h-[1rem] flex items-center justify-center">
          {!showResults && (
            <>
              Waiting for {unansweredCount} more participant{unansweredCount !== 1 ? "s" : ""}
            </>
          )}
        </div>
      </div>
      {quizState === QUIZ_STATES.RESULTS && showResults && (
        <RankingModal open={showRankingModal} questionTotal={questionTotal} />
      )}
    </>
  );
}
