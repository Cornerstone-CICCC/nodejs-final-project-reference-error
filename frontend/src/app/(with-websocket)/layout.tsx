"use client";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { QuizProvider } from "@/stores/quizStore";
import { Geist, Geist_Mono } from "next/font/google";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "../(no-websocket)/auth/hooks/ProtectedRoute";
import { useAuthStore } from "../(no-websocket)/auth/store/useAuthStore";
import { ClientLayout } from "./layout-client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const sessionId = typeof params?.sessionId === "string" ? params.sessionId : "";

  const [hasHostString, setHasHostString] = useState(false);

  const checkPathForHostString = () => {
    const pathName = window.location.pathname;

    const includesHost = pathName.includes("host");
    return includesHost;
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setHasHostString(checkPathForHostString());
  }, []);
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ClientLayout>
          <AuthProvider>
            <WebSocketProvider>
              <QuizProvider sessionId={sessionId} isHost={hasHostString}>
                <ProtectedRoute>{children}</ProtectedRoute>
              </QuizProvider>
            </WebSocketProvider>
          </AuthProvider>
        </ClientLayout>
      </body>
    </html>
  );
}
