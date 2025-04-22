import { AvatarIcon } from "@/components/ui/AvatarIcon";
import { useParticipantStore } from "@/stores/participantStore";
import { Badge } from "flowbite-react";

type HostQuizPanelParticipantsProps = {
  isPaused: boolean;
};
export function HostQuizPanelParticipants({ isPaused }: HostQuizPanelParticipantsProps) {
  const { participants, answeredParticipants } = useParticipantStore();

  // 参加者データに回答情報を統合
  const participantsWithAnswers = participants.map((participant) => {
    // 該当する回答を探す
    const answerData = answeredParticipants.find((a) => a.participantId === participant.id);

    return {
      ...participant,
      // 回答があれば情報を追加
      answer: answerData?.answer || null,
      isCorrect: !!answerData?.isCorrect,
      hasAnswered: answerData?.answer,
    };
  });

  return (
    <div
      className={`flex-1 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2 ${
        isPaused ? "opacity-50 bg-gray-100" : ""
      }`}
    >
      {[...participantsWithAnswers]
        .sort((a, b) => {
          return Number(b.hasAnswered) - Number(a.hasAnswered);
        })
        .map((p) => (
          <div key={p.id} className="flex items-center justify-between p-2 px-5">
            <div className="flex items-center space-x-2">
              <AvatarIcon avatarImage={p.avatar} avatarSize="sm" />
              <div className="flex items-center space-x-3">
                <p className="font-medium">{p.name}</p>
                {p.isGuest && (
                  <Badge color="purple" size="sm">
                    Guest
                  </Badge>
                )}
              </div>
            </div>

            {/* 回答済みの場合のみ回答状態を表示 */}
            {p.hasAnswered && (
              <div className="flex items-center">
                {/* 回答の内容 */}
                <span className="text-sm mr-2 max-w-[120px] truncate">{p.answer}</span>

                {/* 正誤アイコン */}
                {p.isCorrect ? (
                  <span className="flex items-center text-green-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <title>Correct</title>
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414L8.414 15 4.293 10.879a1 1 0 111.414-1.414L8.414 12.586l7.879-7.879a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                ) : (
                  <span className="flex items-center text-red-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <title>Incorrect</title>
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>
            )}
          </div>
        ))}

      {participants.length === 0 && (
        <div className="text-center text-gray-500 py-4">No participants yet</div>
      )}
    </div>
  );
}
