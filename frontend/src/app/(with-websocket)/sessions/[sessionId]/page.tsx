"use client";
import { FinalResultDisplay } from "@/components/pages/sessions/FinalResultDisplay";
import { ParticipantWaitingRoom } from "@/components/pages/sessions/ParticipantWaitingRoom";
import { QuestionDisplay } from "@/components/pages/sessions/QuestionDisplay";
import { FullHeightCardLayout } from "@/components/ui/FullHeightCardLayout";
import { QUIZ_STATES } from "@/constants/quizState";
import { useParticipantStore } from "@/stores/participantStore";
import { useQuiz } from "@/stores/quizStore";
import { useEffect, useState } from "react";

// TODO demo
const demoParticipantsLimit = 10;

export default function SessionPage() {
  const { quizState, currentQuestion, currentRanking } = useQuiz();

  const { participants, sessionId, answeredParticipantsCount, myParticipantId } =
    useParticipantStore();
  const [participantsLimit, setParticipantsLimit] = useState<number>(10);

  useEffect(() => {
    if (!sessionId) return;

    setParticipantsLimit(demoParticipantsLimit);
  }, [sessionId]);

  const myResult = currentRanking.find((p) => p.id === myParticipantId);
  const unansweredCount = participants.length - answeredParticipantsCount;
  return (
    <FullHeightCardLayout useWithHeader={false}>
      {quizState === QUIZ_STATES.WAITING && (
        <ParticipantWaitingRoom participants={participants} participantsLimit={participantsLimit} />
      )}
      {/* 完了状態と進行中状態を別々に条件判定 */}
      {(quizState === QUIZ_STATES.RESULTS || quizState === QUIZ_STATES.ACTIVE) &&
        currentQuestion && (
          <QuestionDisplay question={currentQuestion || {}} unansweredCount={unansweredCount} />
        )}
      {quizState === QUIZ_STATES.COMPLETED && (
        <FinalResultDisplay myResult={myResult ? myResult : null} />
      )}
    </FullHeightCardLayout>
  );
}
