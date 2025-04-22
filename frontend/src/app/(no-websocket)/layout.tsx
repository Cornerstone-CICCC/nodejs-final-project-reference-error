import ClientLayout from "@/app/(no-websocket)/layout-client";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

export const metadata: Metadata = {
  title: "Quizoo",
  description: "Real-time quiz app with a cute animals theme",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
