import "../globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quizoo",
  description: "Real-time quiz app with a cute animals theme",
};

export function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
