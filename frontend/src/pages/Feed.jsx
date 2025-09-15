import React, { useEffect, useState } from "react";
import { getFeed } from "../api/social";
import Skeleton from "../components/Skeleton.jsx";

export default function Feed() {
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

  return (
    <div className="container section">
      <h1 className="h2" style={{ marginTop: 0 }}>Friends Feed</h1>
      {loading ? (
        <div className="grid-rows">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <Skeleton height={16} width="30%" />
              <div className="space" />
              <Skeleton height={12} width="60%" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : items.length === 0 ? (
        <div className="card" style={{ textAlign: "center" }}>
          <div className="h3" style={{ margin: 0 }}>No recent activity</div>
          <div className="caption" style={{ marginTop: 6 }}>Follow friends to see their check-ins here.</div>
        </div>
      ) : (
        <ul className="list-reset grid-12">
          {items.map((it) => (
            <li key={it.id} className="card">
              <div style={{ fontWeight: 600 }}>{it.user?.username || "User"} checked in</div>
              <div style={{ color: "#666" }}>{new Date(it.date).toLocaleDateString()} • {it.habit?.name || "Habit"}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
