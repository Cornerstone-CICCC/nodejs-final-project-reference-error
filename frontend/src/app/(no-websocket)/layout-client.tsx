"use client";
import "../globals.css";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ProtectedRoute } from "./auth/hooks/ProtectedRoute";
import { useAuthStore } from "./auth/store/useAuthStore";

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

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const path = usePathname();
  const isAuthPage = path.startsWith("/auth");

  return (
    <>
      {isAuthPage ? (
        <div className="bg-gray-50 min-h-screen">{children}</div>
      ) : (
        <AuthProvider>
          <ProtectedRoute>{children}</ProtectedRoute>
        </AuthProvider>
      )}
    </>
  );
}
