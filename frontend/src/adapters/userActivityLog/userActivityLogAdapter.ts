import type { CreateUserActivityLog } from "@/types/UserActivity";

class UserActivityLogsAdapters {
  async createUserActivityAdapter(data: CreateUserActivityLog) {
    const response = await fetch(`${process.env.BACKEND_URL}/user_activity_logs/:${data.userId}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to create user activity log");
    }
    return await response.json();
  }
}

export default new UserActivityLogsAdapters();
