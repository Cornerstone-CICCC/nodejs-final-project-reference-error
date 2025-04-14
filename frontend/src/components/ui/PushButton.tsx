import React from "react";

type PushButtonProps = {
    color?: "blue" | "lime" | "red" | "green" | "yellow";
    size?: "sm" | "md" | "lg";
    rounded?: "md" | "lg" | "full";
    width?: string;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    children: React.ReactNode;
};

const sizeClasses = {
    sm: "text-sm py-2 px-4",
    md: "text-base py-3 px-6",
    lg: "text-lg py-4 px-8",
};

const bgColorMap: Record<string, string> = {
    blue: "bg-blue-600",
    lime: "bg-lime-600",
    red: "bg-red-600",
    green: "bg-green-600",
    yellow: "bg-yellow-400"
};

const shadowColorMap: Record<string, string> = {
    blue: "#1e40af",
    lime: "#569e22",
    red: "#b91c1c",
    green: "#036b4f",
    yellow: "#ca8a04",
};

export const PushButton = ({
    color = "blue",
    size = "md",
    rounded = "full",
    width = "",
    onClick,
    disabled = false,
    className = "",
    children,
}: PushButtonProps) => {
    const baseClass = [
        "text-white font-semibold transition duration-100 ease-in-out",
        "active:translate-y-[4px]",
        "disabled:cursor-not-allowed disabled:translate-y-0",
        "relative",
    ].join(" ");

    const combinedClass = `${baseClass} ${sizeClasses[size]} rounded-${rounded} w-${width} ${bgColorMap[color]} ${className}`;

    return (
        <div
            className={`relative rounded-${rounded} w-${width} ${disabled ? "opacity-80" : ""}`}
            style={{
                boxShadow: `0 4px 0 0 ${shadowColorMap[color]}`,
            }}
        >
            <button
                onClick={onClick}
                className={combinedClass}
                disabled={disabled}
            >
                {children}
            </button>
        </div>
    );
};
