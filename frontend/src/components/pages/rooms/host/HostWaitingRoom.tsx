"use client";
import firebaseApp from "@/app/api/firebaseClient";
import { ParticipantList } from "@/components/shared/ParticipantList";
import { QuestionList } from "@/components/shared/QuestionList";
import { WaitingRoomHeader } from "@/components/shared/WaitingRoomHeader";
import { PushButton } from "@/components/ui/PushButton";
import { TabNavigation } from "@/components/ui/Tabs";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useParticipantStore } from "@/stores/participantStore";
import { useQuiz } from "@/stores/quizStore";
import type { Question } from "@/types/Question";
import { get, getDatabase, ref } from "firebase/database";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

// TODO : Demo data
const participantsLimit = 10;

const tabs = [
  { id: "participants", label: "Participants" },
  { id: "questions", label: "Questions" },
];

export function HostWaitingRoom() {
  const { participants } = useParticipantStore();
  const { leaveSession, closeSession, hostJoinSession } = useWebSocket();
  const { startQuiz } = useQuiz();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const params = useParams();
  const { sessionId, roomCode } = params as { sessionId: string; roomCode: string };

  //TODO demo
  const roomUrl = `http://localhost:3000/rooms/${roomCode}`;

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const fetchQuestions = async () => {
      const database = getDatabase(firebaseApp);
      const messagesRef = ref(database, `sessions/${sessionId}/questions`);
      const snapshot = await get(messagesRef);
      const data = snapshot.val();
      if (data) {
        const questionsArray: Question[] = Object.values(data);
        setQuestions(questionsArray);
      }
    };
    hostJoinSession(sessionId);
    fetchQuestions();
  }, []);

  const handleStartQuiz = () => {
    if (participants.length < 2) {
      return;
    }
    startQuiz();
  };

  const handleCloseRoom = () => {
    closeSession(sessionId);
  };

  const handleRemoveParticipant = (id: string) => {
    leaveSession({
      participantId: id,
      sessionId: sessionId as string,
      isHost: true,
    });
  };

  // it's disabled when there are 0 or 1 participants
  const isDisabledStartButton = 2 > participants.length;

  return (
    <div className="h-full flex flex-col text-center gap-2">
      <WaitingRoomHeader
        isHost={true}
        participantsCount={participants.length}
        participantsLimit={participantsLimit}
        roomUrl={roomUrl}
      />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />
      <div className="grow bg-gray-50 border border-gray-50 rounded-lg p-4 overflow-y-auto">
        {activeTab === "participants" ? (
          <ParticipantList
            participants={participants}
            onRemoveParticipant={handleRemoveParticipant}
          />
        ) : (
          <QuestionList questions={questions} />
        )}
      </div>
      <div className="flex gap-2 md:gap-4 mt-2">
        <PushButton color="cancel" size="md" width="full" onClick={handleCloseRoom}>
          Close Room
        </PushButton>
        <PushButton
          color="primary"
          size="md"
          width="full"
          onClick={handleStartQuiz}
          disabled={isDisabledStartButton}
        >
          Start Quiz
        </PushButton>
      </div>
    </div>
  );
}
