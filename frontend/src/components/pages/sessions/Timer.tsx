import { useQuiz } from "@/stores/quizStore";
import { memo, useEffect, useRef } from "react";

interface TimerProps {
  showResults: boolean;
  timeRemaining: number; // 残り時間
  initialTime?: number; // 初期時間（オプション）
}

function TimerComponent({ timeRemaining, initialTime = 30 }: TimerProps) {
  const progress =
    timeRemaining === 0 ? 0 : Math.max(0, Math.min(100, (timeRemaining / initialTime) * 100));
  const { questionIndex } = useQuiz();
  const getColor = () => {
    if (progress > 66) return "green";
    if (progress > 33) return "yellow";
    return "red";
  };

  return (
    <div className="w-full">
      <div className="flex items-between justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">Question {questionIndex + 1}</span>
        <span className="text-sm font-medium text-gray-700">{timeRemaining}s</span>
      </div>
      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${timeRemaining <= 0.1 ? "" : "transition-all duration-950 ease-linear"} transform`}
          style={{
            width: `${progress}%`,
            backgroundColor:
              getColor() === "green" ? "#10b981" : getColor() === "yellow" ? "#f59e0b" : "#ef4444",
          }}
        />
      </div>
    </div>
  );
}

// biome-ignore lint/style/useNamingConvention: <explanation>
const Timer = memo(TimerComponent);

export function TimerContainer({
  showResults,
  onTimeExpire,
}: {
  initialTime?: number;
  showResults: boolean;
  onTimeExpire: () => void;
}) {
  const { timeRemaining, currentQuestion } = useQuiz();
  const initialTimeRef = useRef(currentQuestion?.timeLimit || 30);

  // 新しい問題が来たとき
  useEffect(() => {
    if (currentQuestion) {
      initialTimeRef.current = currentQuestion.timeLimit;
    }
  }, [currentQuestion]);

  // 時間切れ処理
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    // 時間が0になったらonTimeExpireを呼び出す
    if (timeRemaining === 0) {
      onTimeExpire();
    }
  }, [timeRemaining]);

  return (
    <Timer
      timeRemaining={timeRemaining}
      initialTime={initialTimeRef.current}
      showResults={showResults}
    />
  );
}
