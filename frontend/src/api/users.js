import { api } from "./axios";

export async function searchUsers(q, limit = 20) {
  const { data } = await api.get("/users/search", { params: { q, limit } });
  return data.users;
}
