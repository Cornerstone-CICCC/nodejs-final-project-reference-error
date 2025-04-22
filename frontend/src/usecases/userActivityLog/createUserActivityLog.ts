import api from "@/app/api/client";
import type { CreateUserActivityLog } from "@/types/UserActivity";
import axios from "axios";

export const createUserActivityLog = async (userActivityLog: CreateUserActivityLog) => {
  try {
    const data = await api.post("/userActivityLog", userActivityLog);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || "An error occurred";
      throw new Error(errorMessage);
    }
    throw new Error("An unexpected error occurred");
  }
};
