import type { Quiz } from "@/types/Quiz";

class QuizAdapters {
  async getAllQuizzesAdapter(): Promise<Quiz[]> {
    const response = await fetch(`${process.env.BACKEND_URL}/quizzes`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get all quizzes");
    }

    const data: Quiz[] = await response.json();
    return data;
  }

  async getQuizByIdAdapter(id: string): Promise<Quiz> {
    const response = await fetch(`${process.env.BACKEND_URL}/quizzes/${id}`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get specified quiz");
    }

    const data: Quiz = await response.json();
    return data;
  }
}

export default new QuizAdapters();
