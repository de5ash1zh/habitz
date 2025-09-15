import React, { useEffect, useMemo, useState } from "react";
import { getCheckIns } from "../api/checkins";
import { todayISO } from "../utils/dates";

function pct(n, d) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

export default function CompletionProgress({ habitId, days = 7, refreshKey }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkins, setCheckins] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const to = todayISO();
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - (days - 1));
        const from = fromDate.toISOString().slice(0, 10);
        const data = await getCheckIns(habitId, { from, to });
        setCheckins(data);
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load progress");
      } finally {
        setLoading(false);
      }
    }
    if (habitId) load();
  }, [habitId, days, refreshKey]);

  const { completed, total } = useMemo(() => {
    // For daily habits, total equals 'days'. For now assume daily.
    // If you add weekly/custom logic, adjust accordingly.
    const done = checkins.filter((c) => c.completed).length;
    return { completed: done, total: days };
  }, [checkins, days]);

  if (loading) return <div>Progress: …</div>;
  if (error) return <div>Progress: --</div>;

  const percent = pct(completed, total);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, background: "#eee", height: 8, borderRadius: 999 }}>
        <div style={{ width: `${percent}%`, background: "#3b82f6", height: 8, borderRadius: 999 }} />
      </div>
      <div style={{ fontSize: 12, color: "#555" }}>{percent}% in {days}d</div>
    </div>
  );
}
