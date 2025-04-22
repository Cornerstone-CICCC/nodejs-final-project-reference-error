import { AvatarIcon } from "@/components/ui/AvatarIcon";
import { PushButton } from "@/components/ui/PushButton";
import { useQuiz } from "@/stores/quizStore";

import type { ParticipantRanking } from "@/types/Result";

function PodiumPlace({ rank, participant }: { rank: number; participant: ParticipantRanking }) {
  const bgColor = rank === 1 ? "bg-yellow-300" : rank === 2 ? "bg-gray-200" : "bg-orange-300";
  const heightClass = rank === 1 ? "h-32" : rank === 2 ? "h-24" : "h-20";

  return (
    <div className="flex flex-col items-center">
      <AvatarIcon avatarImage={participant.avatar} avatarSize="md" />
      <span className="text-center font-semibold">{participant.name}</span>
      <div
        className={`w-16 flex flex-col items-center justify-center text-xl font-bold rounded-t-md ${heightClass} ${bgColor}`}
      >
        <span>{rank}</span>
        <span className="text-xs text-gray-500">{participant.score}pt</span>
      </div>
    </div>
  );
}

function VerticalPodiumPlace({
  rank,
  participant,
}: {
  rank: number;
  participant: ParticipantRanking;
}) {
  const bgColor = rank === 1 ? "text-yellow-300" : rank === 2 ? "text-gray-300" : "text-orange-300";
  const textSize = rank === 1 ? "text-xl" : "text-lg";

  return (
    <div className="flex items-center gap-2 rounded-lg py-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`w-10 h-10 ${bgColor}`}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <title>crown</title>
        <path d="M4 4l4 8 4-6 4 6 4-8-2 14H6L4 4z" />
      </svg>
      <div className="text-xl font-extrabold w-6 text-center">{rank}</div>
      <AvatarIcon avatarImage={participant.avatar} avatarSize="md" />
      <div className="flex-1 ml-2">
        <p className={`font-semibold ${textSize}`}>{participant.name}</p>
        <p className="text-sm text-gray-500">{participant.score}pt</p>
      </div>
    </div>
  );
}

function RankingItem({ participant }: { participant: ParticipantRanking }) {
  return (
    <div key={participant.id} className="flex items-center gap-2 py-2 px-4">
      <div className="text-lg font-bold w-6 text-center">{participant.rank}</div>
      <AvatarIcon avatarImage={participant.avatar} avatarSize="sm" />
      <div className="flex-1 ml-2">
        <p>{participant.name}</p>
        <p className="text-sm text-gray-500">{participant.score}pt</p>
      </div>
    </div>
  );
}

type RankingListProps = {
  isVertical?: boolean;
};
export function RankingList({ isVertical = false }: RankingListProps) {
  const { currentRanking, isHost, questionIndex, nextQuestion, questionTotal } = useQuiz();
  const handleNextQuestion = () => {
    nextQuestion();
  };

  return (
    <div className="flex flex-col h-[70vh]">
      {!isVertical && (
        <div className="flex justify-center items-end gap-4">
          {currentRanking[0] && (
            <PodiumPlace key={currentRanking[0].id} rank={1} participant={currentRanking[0]} />
          )}
          {currentRanking[1] && (
            <PodiumPlace key={currentRanking[1].id} rank={2} participant={currentRanking[1]} />
          )}

          {currentRanking[2] && (
            <PodiumPlace key={currentRanking[2].id} rank={3} participant={currentRanking[2]} />
          )}
        </div>
      )}
      <div className="flex-1 bg-gray-100 rounded-lg p-4 overflow-y-auto">
        {isVertical && (
          <div className="flex flex-col justify-start gap-2 mb-2">
            {currentRanking[0] && (
              <VerticalPodiumPlace
                key={currentRanking[0].id}
                rank={1}
                participant={currentRanking[0]}
              />
            )}
            {currentRanking[1] && (
              <VerticalPodiumPlace
                key={currentRanking[1].id}
                rank={2}
                participant={currentRanking[1]}
              />
            )}
            {currentRanking[2] && (
              <VerticalPodiumPlace
                key={currentRanking[2].id}
                rank={3}
                participant={currentRanking[2]}
              />
            )}
          </div>
        )}
        {currentRanking.slice(3).map((participant) => (
          <RankingItem key={participant.id} participant={participant} />
        ))}
      </div>
      {isHost && (
        <div className="text-center flex items-end justify-center mt-3">
          {questionIndex + 1 === questionTotal ? (
            <PushButton onClick={handleNextQuestion} color="warning" size="md" width="full">
              End Quiz
            </PushButton>
          ) : (
            <PushButton onClick={handleNextQuestion} color="primary" size="md" width="full">
              Next Question
            </PushButton>
          )}
        </div>
      )}
    </div>
  );
}
