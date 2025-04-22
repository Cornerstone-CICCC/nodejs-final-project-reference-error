// app/api/question/[id]/route.ts
import QuizAdapters from "@/adapters/quiz/quizAdapter";
import { NextResponse } from "next/server";

// biome-ignore lint/style/useNamingConvention: <explanation>
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (request.method !== "GET") {
    return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
  }
  const { id } = await params;
  try {
    const response = await QuizAdapters.getQuizByIdAdapter(id);

    if (!response) {
      return NextResponse.json({ message: "Quiz found" }, { status: 404 });
    }

    return NextResponse.json({
      response,
    });
  } catch (error) {
    console.error("Error in get quiz by ID route:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
