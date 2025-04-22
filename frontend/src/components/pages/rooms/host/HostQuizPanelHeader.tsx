import { useParticipantStore } from "@/stores/participantStore";
import { useQuiz } from "@/stores/quizStore";

type HostQuizPanelHeaderProps = {
  isPaused: boolean;
  unansweredCount: number;
};

export function HostQuizPanelHeader({ isPaused, unansweredCount }: HostQuizPanelHeaderProps) {
  const { questionIndex } = useQuiz();
  const { participants } = useParticipantStore();

  return (
    <div className="flex items-center justify-between relative">
      <div className="flex items-center">
        <h2 className="text-2xl font-bold">Question {questionIndex + 1}</h2>
        {isPaused && <span className="text-red-600 font-semibold ml-3">Paused</span>}
      </div>
      <span className="text-sm text-gray-500">
        {unansweredCount} / {participants.length}
      </span>
      {isPaused && (
        <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-500 text-lg font-bold pointer-events-none">
          PAUSED
        </span>
      )}
    </div>
  );
}
