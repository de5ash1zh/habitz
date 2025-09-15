import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listHabits, createHabit, deleteHabit } from "../api/habits";
import { createOrUpdateCheckIn, getCheckIns } from "../api/checkins";
import { todayISO } from "../utils/dates";
import StreakDisplay from "../components/StreakDisplay.jsx";
import Modal from "../components/Modal.jsx";
import HabitForm from "../components/HabitForm.jsx";
import CompletionProgress from "../components/CompletionProgress.jsx";
import Spinner from "../components/Spinner.jsx";
import Skeleton from "../components/Skeleton.jsx";
import { getHabitStreaks } from "../api/habits";
import { MoreVertical } from "lucide-react";
import ConnectionStatus from "../components/ConnectionStatus.jsx";
import StreakRing from "../components/StreakRing.jsx";

export default function Dashboard() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [todayMap, setTodayMap] = useState({}); // habitId -> boolean completed
  const [showCreate, setShowCreate] = useState(false);
  const [sortKey, setSortKey] = useState("created"); // created|alpha|streak
  const [streakMap, setStreakMap] = useState({}); // habitId -> { current, longest, completionRate }
  const [stats, setStats] = useState({ total: 0, avgCompletion: 0, longestDaily: 0, currentBest: 0 });
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [animating, setAnimating] = useState({}); // habitId -> true/false
  // Filters
  const [filterCategory, setFilterCategory] = useState("");
  const [filterTags, setFilterTags] = useState("");
  const [filterQ, setFilterQ] = useState("");

  async function refresh() {
    try {
      setLoading(true);
      const params = {};
      if (filterCategory) params.category = filterCategory;
      if (filterTags) params.tags = filterTags;
      if (filterQ) params.q = filterQ;
      const data = await listHabits(params);
      setHabits(data);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load habits");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    async function loadTodayStatuses() {
      const today = todayISO();
      const entries = await Promise.all(
        habits.map(async (h) => {
          try {
            const res = await getCheckIns(h._id, { from: today, to: today });
            const done = res.some((c) => c.completed);
            return [h._id, done];
          } catch (_e) {
            return [h._id, false];
          }
        })
      );
      setTodayMap(Object.fromEntries(entries));
    }
    if (habits.length) loadTodayStatuses();
  }, [habits]);

  // Load streaks for stats and sorting
  useEffect(() => {
    async function loadStreaks() {
      try {
        const entries = await Promise.all(
          habits.map(async (h) => {
            try {
              const data = await getHabitStreaks(h._id);
              return [h._id, { current: data.daily.currentStreak, longest: data.daily.longestStreak, completionRate: data.completion.completionRate }];
            } catch (_e) {
              return [h._id, { current: 0, longest: 0, completionRate: 0 }];
            }
          })
        );
        const map = Object.fromEntries(entries);
        setStreakMap(map);
        const total = habits.length;
        const avg = total ? Math.round(entries.reduce((acc, [,v]) => acc + (v.completionRate||0), 0) / total) : 0;
        const longestDaily = entries.reduce((m, [,v]) => Math.max(m, v.longest||0), 0);
        const currentBest = entries.reduce((m, [,v]) => Math.max(m, v.current||0), 0);
        setStats({ total, avgCompletion: avg, longestDaily, currentBest });
      } catch (_e) {}
    }
    if (habits.length) loadStreaks();
  }, [habits]);

  function sortHabits(items) {
    const copy = [...items];
    if (sortKey === "alpha") {
      copy.sort((a,b)=>a.name.localeCompare(b.name));
    } else if (sortKey === "streak") {
      copy.sort((a,b)=> (streakMap[b._id]?.current||0) - (streakMap[a._id]?.current||0));
    } else {
      // createdAt desc
      copy.sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return copy;
  }

  // Monochrome chips: emerald on white

  async function createViaModal(values) {
    try {
      setSaving(true);
      const habit = await createHabit(values);
      setHabits((prev) => [habit, ...prev]);
      setShowCreate(false);
      setError("");
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to create habit");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    if (!confirm("Delete this habit?")) return;
    try {
      await deleteHabit(id);
      setHabits((prev) => prev.filter((h) => h._id !== id));
      setTodayMap((m) => {
        const copy = { ...m };
        delete copy[id];
        return copy;
      });
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to delete");
    }
  }

  async function toggleToday(habitId) {
    const today = todayISO();
    const current = !!todayMap[habitId];
    try {
      await createOrUpdateCheckIn({ habitId, date: today, completed: !current });
      setTodayMap((m) => ({ ...m, [habitId]: !current }));
      // micro-interaction animation
      setAnimating((a) => ({ ...a, [habitId]: true }));
      setTimeout(() => setAnimating((a) => ({ ...a, [habitId]: false })), 320);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to update check-in");
    }
  }

  return (
    <div className="container section">
      <div className="page-header">
        <h1 className="h1" style={{ marginTop: 0, marginBottom: 0 }}>Dashboard</h1>
        <div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Habit</button>
        </div>
      </div>
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}

      <section className="section">
        {/* Filters */}
        <div className="card" style={{ marginBottom: 12, display: "grid", gap: 12 }}>
          <div className="filter-grid">
            <div>
              <label className="caption">Category</label>
              <select value={filterCategory} onChange={(e)=>setFilterCategory(e.target.value)}>
                <option value="">All</option>
                <option value="Health">Health</option>
                <option value="Fitness">Fitness</option>
                <option value="Reading">Reading</option>
                <option value="Learning">Learning</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
            <div>
              <label className="caption">Tags</label>
              <input placeholder="comma,separated,tags" value={filterTags} onChange={(e)=>setFilterTags(e.target.value)} />
            </div>
            <div>
              <label className="caption">Search</label>
              <input placeholder="Search by name" value={filterQ} onChange={(e)=>setFilterQ(e.target.value)} />
            </div>
            <div style={{ alignSelf: "end", display: "flex", gap: 8 }}>
              <button className="btn" onClick={refresh}>Apply</button>
              <button className="btn btn-ghost" onClick={()=>{ setFilterCategory(""); setFilterTags(""); setFilterQ(""); setTimeout(refresh,0); }}>Clear</button>
            </div>
          </div>
        </div>
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="stat-grid">
            <div>
              <div className="muted" style={{ fontSize: 12 }}>Total Habits</div>
              <div style={{ fontWeight: 700, fontSize: 22 }}>{stats.total}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>Avg 7d Completion</div>
              <div style={{ fontWeight: 700, fontSize: 22 }}>{stats.avgCompletion}%</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>Best Current Streak</div>
              <div style={{ fontWeight: 700, fontSize: 22 }}>{stats.currentBest}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>Best Longest Streak</div>
              <div style={{ fontWeight: 700, fontSize: 22 }}>{stats.longestDaily}</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
              <label className="muted" style={{ fontSize: 12 }}>Sort</label>
              <select className="btn" value={sortKey} onChange={(e)=>setSortKey(e.target.value)}>
                <option value="created">Created</option>
                <option value="alpha">Alphabetical</option>
                <option value="streak">Current Streak</option>
              </select>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h2 className="h2" style={{ margin: 0 }}>Your Habits</h2>
          <span className="caption">Manage and track your routines</span>
        </div>
        {loading ? (
          <div style={{ display: "grid", gap: 8 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card">
                <Skeleton height={18} width="40%" />
                <div className="space" />
                <Skeleton height={12} width="60%" />
                <div className="space" />
                <Skeleton height={10} width="80%" />
              </div>
            ))}
          </div>
        ) : habits.length === 0 ? (
          <div className="card-premium" style={{ textAlign: "center" }}>
            <div className="h3" style={{ margin: 0 }}>No habits yet</div>
            <div className="caption" style={{ marginTop: 6 }}>Create your first habit to start building momentum.</div>
            <div className="section" />
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Habit</button>
              <Link to="/habits/new" className="btn">Open Full Form</Link>
            </div>
          </div>
        ) : (
          <ul className="habit-grid">
            {sortHabits(habits).map((h) => (
              <li key={h._id} className="card-premium habit-card">
                <div>
                  <div className="row" style={{ alignItems: "center", gap: 12 }}>
                    <StreakRing value={streakMap[h._id]?.current || 0} max={30} size={44} stroke={6} />
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{h.name}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#666", fontSize: 13, marginTop: 6 }}>
                    <span className="chip">{h.category || "Uncategorized"}</span>
                    <span>• {h.frequency}</span>
                    {typeof streakMap[h._id]?.current === 'number' && (
                      <span className="muted">• Streak {streakMap[h._id].current}</span>
                    )}
                  </div>
                  <div className="section-sm" />
                  <div>
                    <StreakDisplay habitId={h._id} refreshKey={todayMap[h._id]} />
                  </div>
                  <div className="section-sm" />
                  <div>
                    <CompletionProgress habitId={h._id} days={7} refreshKey={todayMap[h._id]} />
                  </div>
                </div>
                <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
                  <button
                    className={"btn " + (todayMap[h._id] ? "btn-success" : "") }
                    onClick={() => toggleToday(h._id)}
                    style={animating[h._id] ? { background: "var(--black)", color: "#fff", transform: "scale(1.05)", transition: "transform 250ms var(--ease, ease-out)" } : undefined}
                  >
                    {todayMap[h._id] ? "Done Today" : "Mark Done"}
                  </button>
                  <div style={{ position: "relative" }}>
                    <button className="btn-icon" aria-label="More" onClick={() => setMenuOpenId(menuOpenId === h._id ? null : h._id)}>
                      <MoreVertical size={18} />
                    </button>
                    {menuOpenId === h._id && (
                      <div className="menu">
                        <Link className="menu-item" to={`/habits/${h._id}/edit`} onClick={() => setMenuOpenId(null)} style={{ textDecoration: "none", color: "inherit", display: "block" }}>Edit</Link>
                        <div className="menu-item" onClick={() => { setMenuOpenId(null); onDelete(h._id); }}>Delete</div>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal open={showCreate} onClose={() => setShowCreate(false)}>
        <h2 style={{ marginTop: 0 }}>Create Habit</h2>
        <HabitForm onSubmit={createViaModal} submitLabel={saving ? "Saving..." : "Create"} onCancel={() => setShowCreate(false)} />
      </Modal>

      <ConnectionStatus />
    </div>
  );
}
