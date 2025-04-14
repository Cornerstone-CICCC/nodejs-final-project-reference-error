import { useState, useEffect } from 'react';
import { Progress } from 'flowbite-react';

interface TimerProps {
    duration: number; // seconds
    onExpire: () => void;
    isActive: boolean;
}

export const Timer = ({ duration, onExpire, isActive }: TimerProps) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    const progress = (timeLeft / duration) * 100;

    useEffect(() => {
        setTimeLeft(duration);
    }, [duration]);

    useEffect(() => {
        if (!isActive) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onExpire();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isActive, onExpire]);

    const getColor = () => {
        if (progress > 66) return 'green';
        if (progress > 33) return 'yellow';
        return 'red';
    };

    return (
        <div className="w-full">
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                    Time Left
                </span>
                <span className="text-sm font-medium text-gray-700">
                    {Math.ceil(timeLeft)} seconds
                </span>
            </div>
            <Progress
                progress={progress}
                color={getColor()}
                size="lg"
            />
        </div>
    );
}; 