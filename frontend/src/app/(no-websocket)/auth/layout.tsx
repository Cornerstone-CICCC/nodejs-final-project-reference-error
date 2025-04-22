import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quizoo",
  description: "Real-time quiz app with a cute animals theme",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">{children}</div>
  );
}
