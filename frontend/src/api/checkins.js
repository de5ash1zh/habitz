import { api } from "./axios";

export async function createOrUpdateCheckIn({ habitId, date, completed = true }) {
  const { data } = await api.post("/checkins", { habitId, date, completed });
  return data.checkIn;
}

export async function getCheckIns(habitId, params = {}) {
  const { data } = await api.get(`/checkins/${habitId}`, { params });
  return data.checkIns;
}
