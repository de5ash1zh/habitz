import { api } from "./axios";

export async function followUser(userId) {
  const { data } = await api.post("/follow", { userId });
  return data.follow || data;
}

export async function unfollowUser(userId) {
  const { data } = await api.delete(`/unfollow/${userId}`);
  return data;
}

export async function getFriends() {
  const { data } = await api.get("/friends");
  return data.friends;
}

// Unified feed helper with optional limit
export async function getFeed(limit = 50) {
  const { data } = await api.get("/feed", { params: { limit } });
  return data.items || [];
}

export async function getLeaderboard(params = {}) {
  const { data } = await api.get("/leaderboard", { params });
  return data; // { items, metric }
}
