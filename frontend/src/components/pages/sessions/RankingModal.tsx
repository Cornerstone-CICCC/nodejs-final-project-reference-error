"use client";
import { RankingList } from "@/components/pages/sessions/RankingList";
import { useQuiz } from "@/stores/quizStore";
import { useEffect, useState } from "react";

type RankingModalProps = {
  open: boolean;
  questionTotal: number;
};

export function RankingModal({ open, questionTotal }: RankingModalProps) {
  const [isVisible, setIsVisible] = useState(open);
  const [animateIn, setAnimateIn] = useState(false);
  const [dynamicIsVertical, setDynamicIsVertical] = useState(false); // Default to true
  const mobileQuery = "(max-width: 767px)";
  const { questionIndex } = useQuiz();

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        setAnimateIn(true);
      });
    } else {
      setAnimateIn(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300); //  duration
      return () => clearTimeout(timer);
    }
  }, [open]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const handleMediaQueryChange = () => {
      if (window.matchMedia(mobileQuery).matches) {
        setDynamicIsVertical(true);
      } else {
        setDynamicIsVertical(false);
      }
    };

    // Initial check
    handleMediaQueryChange();

    // Listen for changes
    const mobileMediaQueryList = window.matchMedia(mobileQuery);

    mobileMediaQueryList.addEventListener("change", handleMediaQueryChange);

    // Cleanup
    return () => {
      mobileMediaQueryList.removeEventListener("change", handleMediaQueryChange);
    };
  }, [dynamicIsVertical]); // Depend on isVertical to react to prop changes

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 h-full w-full bg-gray-900/80 z-50 transition-opacity duration-300 ${
        animateIn ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl mx-auto h-[90vh] flex flex-col justify-between bg-white rounded-t-xl p-6 transition-transform duration-300 ease-out ${
          animateIn ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold mb-2">Current Ranking</h2>
          <span className="text-sm bg-gray-100 text-gray-500 py-1 px-2 rounded-full">
            Question {questionIndex + 1}/{questionTotal}
          </span>
        </div>
        <RankingList isVertical={dynamicIsVertical} />
      </div>
    </div>
  );
}
