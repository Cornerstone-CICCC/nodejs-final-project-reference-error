"use client";
import { RankingModal } from "@/components/pages/sessions/RankingModal";
import { PushButton } from "@/components/ui/PushButton";
import { QUIZ_STATES } from "@/constants/quizState";
import { useQuiz } from "@/stores/quizStore";
import type { Question } from "@/types/Question";
// import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { HostQuizPanelHeader } from "./HostQuizPanelHeader";
import { HostQuizPanelParticipants } from "./HostQuizPanelParticipants";
import { HostQuizPanelQuestion } from "./QuestionOptions";

type Props = {
  question: Question;
  unansweredCount: number;
};

export function HostQuizPanel({ question, unansweredCount }: Props) {
  // const { sessionId } = useParams() as { sessionId: string };
  const [isPaused, setIsPaused] = useState(false);
  const { quizState, questionTotal, showResults, setShowResults, timeRemaining } = useQuiz();

  const togglePause = async () => {
    const newState = !isPaused;
    setIsPaused(newState);
  };

  useEffect(() => {
    if (quizState === QUIZ_STATES.RESULTS && timeRemaining === 0) {
      setShowResults(true);
    }
  }, [quizState]);

  return (
    <div className="flex flex-col h-full gap-4">
      <HostQuizPanelHeader isPaused={isPaused} unansweredCount={unansweredCount} />
      <HostQuizPanelQuestion question={question} />
      <HostQuizPanelParticipants isPaused={isPaused} />

      <div className="flex gap-2 md:gap-4 mt-2 flex-shrink-0">
        <PushButton
          color="primary"
          size="md"
          width="full"
          onClick={togglePause}
          disabled={!isPaused}
        >
          Resume Quiz
        </PushButton>
        <PushButton color="cancel" size="md" width="full" onClick={togglePause} disabled={isPaused}>
          Pause Quiz
        </PushButton>
      </div>
      {quizState === QUIZ_STATES.RESULTS && showResults && (
        <RankingModal open={showResults} questionTotal={questionTotal} />
      )}
    </div>
  );
}
