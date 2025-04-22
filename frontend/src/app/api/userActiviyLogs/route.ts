import userActivityLogAdapters from "@/adapters/userActivityLog/userActivityLogAdapter";
import { NextResponse } from "next/server";

// biome-ignore lint/style/useNamingConvention: <explanation>
export async function POST(request: Request) {
  if (request.method !== "POST") {
    return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();

    const { correctAnswers, userId, questionsAnswered } = body;

    if (correctAnswers === null || correctAnswers === undefined) {
      return NextResponse.json(
        { message: "correctAnswers cannot be null or undefined" },
        { status: 400 },
      );
    }

    if (questionsAnswered === undefined || questionsAnswered === null) {
      return NextResponse.json(
        { message: "questionsAnswered cannot be null or undefined" },
        { status: 400 },
      );
    }

    if (!userId) {
      return NextResponse.json(
        { message: "correctAnswers, userId, and questionsAnswered are required" },
        { status: 400 },
      );
    }
    const userActivityLog = await userActivityLogAdapters.createUserActivityAdapter({
      userId,
      questionsAnswered,
      correctAnswers,
    });
    return NextResponse.json(
      { message: "UserActivityLog created", userActivityLog },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating user activity log:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
