import React from "react";
import { getLeaderboard } from "../api/social";
import Skeleton from "../components/Skeleton.jsx";

export default function Leaderboard() {
  const [metric, setMetric] = React.useState("current");
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  async function load() {
    try {
      setLoading(true);
      const { items: list } = await getLeaderboard({ metric, limit: 50 });
      setItems(list || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metric]);

  return (
    <div className="container section">
      <div className="page-header">
        <h1 className="h1" style={{ margin: 0 }}>Leaderboard</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={`btn ${metric === "current" ? "btn-primary" : ""}`} onClick={() => setMetric("current")}>Current</button>
          <button className={`btn ${metric === "longest" ? "btn-primary" : ""}`} onClick={() => setMetric("longest")}>Longest</button>
          <button className={`btn ${metric === "completion" ? "btn-primary" : ""}`} onClick={() => setMetric("completion")}>7d Completion</button>
        </div>
      </div>

      <section className="section">
        {loading ? (
          <div className="card">
            <Skeleton height={18} width="40%" />
            <div className="space" />
            <Skeleton height={12} width="70%" />
            <div className="space" />
            <Skeleton height={12} width="60%" />
          </div>
        ) : error ? (
          <div style={{ color: "red" }}>{error}</div>
        ) : items.length === 0 ? (
          <div className="card" style={{ textAlign: "center" }}>
            <div className="h3" style={{ margin: 0 }}>No data yet</div>
            <div className="caption" style={{ marginTop: 6 }}>Start tracking habits to appear on the leaderboard.</div>
          </div>
        ) : (
          <div className="card">
            <div className="simple-grid-4" style={{ fontWeight: 600 }}>
              <div className="caption">Rank</div>
              <div className="caption">User</div>
              <div className="caption">Current</div>
              <div className="caption">Longest</div>
            </div>
            <div className="space" />
            <ul className="list-reset grid-rows">
              {items.map((it, idx) => (
                <li key={it.user.id} className="simple-grid-4" style={{ borderTop: "1px solid var(--fog)", paddingTop: 8 }}>
                  <div style={{ fontWeight: 700 }}>{idx + 1}</div>
                  <div style={{ fontWeight: 600 }}>{it.user.username}</div>
                  <div>{it.current}</div>
                  <div>{it.longest}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
