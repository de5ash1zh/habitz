import { api } from "./axios";

export async function checkAvailability({ username, email }) {
  const params = {};
  if (username) params.username = username;
  if (email) params.email = email;
  const { data } = await api.get("/auth/availability", { params });
  return data.available;
}
