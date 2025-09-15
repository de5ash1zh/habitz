import React, { useEffect, useState } from "react";
import { getFeed } from "../api/social";

export default function FriendsFeed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const list = await getFeed();
        setItems(list);
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load feed");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (items.length === 0) return <div>No recent activity yet. Follow friends to see their check-ins.</div>;

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
      {items.map((it) => (
        <li key={it.id} style={{ border: "1px solid #eee", padding: 12, borderRadius: 8 }}>
          <div style={{ fontWeight: 600 }}>{it.user?.username || "User"} checked in</div>
          <div style={{ color: "#666" }}>{new Date(it.date).toLocaleDateString()} • {it.habit?.name || "Habit"}</div>
        </li>
      ))}
    </ul>
  );
}
