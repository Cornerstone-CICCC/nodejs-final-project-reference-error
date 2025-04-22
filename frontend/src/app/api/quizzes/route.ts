import QuizAdapters from "@/adapters/quiz/quizAdapter";
import { NextResponse } from "next/server";

// biome-ignore lint/style/useNamingConvention: <explanation>
export async function GET(request: Request) {
  if (request.method !== "GET") {
    return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
  }

  try {
    const response = await QuizAdapters.getAllQuizzesAdapter();

    if (!response) {
      return NextResponse.json({ message: "Quizzes not found" }, { status: 404 });
    }

    return NextResponse.json({
      response,
    });
  } catch (error) {
    console.error("Error in get quiz route:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
