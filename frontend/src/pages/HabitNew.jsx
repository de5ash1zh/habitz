import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createHabit } from "../api/habits";
import HabitForm from "../components/HabitForm.jsx";

export default function HabitNew() {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(values) {
    setError("");
    try {
      setSaving(true);
      await createHabit(values);
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to create habit");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container section">
      <h1 className="h2" style={{ marginTop: 0 }}>Create Habit</h1>
      <div className="card">
        <HabitForm onSubmit={handleSubmit} submitLabel={saving ? "Saving..." : "Create"} onCancel={() => navigate(-1)} />
        {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
      </div>
    </div>
  );
}
