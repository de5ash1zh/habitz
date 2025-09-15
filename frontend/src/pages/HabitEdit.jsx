import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { updateHabit } from "../api/habits";
import { api } from "../api/axios";

export default function HabitEdit() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data } = await api.get(`/habits/${id}`);
        setName(data.habit.name || "");
        setCategory(data.habit.category || "");
        setFrequency(data.habit.frequency || "daily");
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load habit");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      setSaving(true);
      await updateHabit(id, { name: name.trim(), category: category.trim(), frequency });
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update habit");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="container section">Loading...</div>;

  return (
    <div className="container section">
      <h1 className="h2" style={{ marginTop: 0 }}>Edit Habit</h1>
      <div className="card" style={{ maxWidth: 560 }}>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <div>
            <label htmlFor="name">Name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="category">Category</label>
            <input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div>
            <label htmlFor="frequency">Frequency</label>
            <select id="frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {error && <div style={{ color: "red" }}>{error}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button className="btn btn-primary" disabled={saving} type="submit">{saving ? "Saving..." : "Save"}</button>
            <button className="btn btn-ghost" type="button" onClick={() => navigate(-1)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
