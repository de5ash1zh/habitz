import { api } from "./axios";

export async function listHabits(params = {}) {
  const { data } = await api.get("/habits", { params });
  return data.habits;
}

export async function createHabit(payload) {
  const { data } = await api.post("/habits", payload);
  return data.habit;
}

export async function updateHabit(id, payload) {
  const { data } = await api.put(`/habits/${id}`, payload);
  return data.habit;
}

export async function deleteHabit(id) {
  const { data } = await api.delete(`/habits/${id}`);
  return data;
}

export async function getHabitStreaks(id) {
  const { data } = await api.get(`/habits/${id}/streaks`);
  return data; // { daily, weekly, completion }
}

export async function validateHabitStreaks(id, payload) {
  const { data } = await api.post(`/habits/${id}/validate-streaks`, payload);
  return data;
}
