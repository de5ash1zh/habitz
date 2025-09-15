import React, { useEffect, useMemo, useState } from "react";
import { getCheckIns } from "../api/checkins";
import { todayISO } from "../utils/dates";
import { getHabitStreaks } from "../api/habits";

function computeDailyStreak(dates) {
  // dates: array of ISO strings (YYYY-MM-DD) or Date objects
  const set = new Set(
    dates.map((d) => {
      const dt = d instanceof Date ? d : new Date(d);
      const y = dt.getUTCFullYear();
      const m = dt.getUTCMonth();
      const day = dt.getUTCDate();
      return new Date(Date.UTC(y, m, day)).toISOString().slice(0, 10);
    })
  );

  const today = new Date();
  const base = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (set.has(key)) streak += 1; else break;
  }
  return streak;
}

export default function StreakDisplay({ habitId, rangeDays = 60, refreshKey, useServer = true }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkins, setCheckins] = useState([]);
  const [serverStreaks, setServerStreaks] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        // Try server streaks first if enabled
        if (useServer) {
          try {
            const data = await getHabitStreaks(habitId);
            setServerStreaks(data);
          } catch (_e) {
            setServerStreaks(null);
          }
        }
        // Always load recent check-ins for fallback and client-side calc
        const to = todayISO();
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - rangeDays);
        const from = fromDate.toISOString().slice(0, 10);
        const data = await getCheckIns(habitId, { from, to });
        setCheckins(data);
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load streak");
      } finally {
        setLoading(false);
      }
    }
    if (habitId) load();
  }, [habitId, rangeDays, refreshKey, useServer]);

  const currentStreak = useMemo(() => {
    const dates = checkins.filter((c) => c.completed).map((c) => c.date);
    return computeDailyStreak(dates);
  }, [checkins]);

  if (loading) return <span>Streak: …</span>;
  if (error) return <span>Streak: --</span>;

  // If server data available, render richer info
  if (serverStreaks) {
    const d = serverStreaks.daily || { currentStreak: currentStreak, longestStreak: currentStreak };
    const w = serverStreaks.weekly || { currentStreak: 0, longestStreak: 0 };
    const c = serverStreaks.completion || { completionRate: 0 };
    return (
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", fontSize: 14 }}>
        <span title="Daily streak">Daily {d.currentStreak} <span className="muted" style={{ fontSize: 12 }}>(best {d.longestStreak})</span></span>
        <span title="Weekly streak">Weekly {w.currentStreak} <span className="muted" style={{ fontSize: 12 }}>(best {w.longestStreak})</span></span>
        <span title="7-day completion" className="muted">{c.completionRate}% 7d</span>
      </div>
    );
  }

  // Fallback simple daily streak
  return <span>Streak: {currentStreak}</span>;
}
