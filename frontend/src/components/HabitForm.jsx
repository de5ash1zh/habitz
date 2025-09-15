import React, { useState } from "react";

export default function HabitForm({ initial = { name: "", category: "", frequency: "daily", tags: [] }, onSubmit, submitLabel = "Save", onCancel }) {
  const [name, setName] = useState(initial.name || "");
  const [category, setCategory] = useState(initial.category || "");
  const [frequency, setFrequency] = useState(initial.frequency || "daily");
  const [tags, setTags] = useState(Array.isArray(initial.tags) ? initial.tags.join(", ") : "");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const e = {};
    if (!name.trim()) e.name = "Name is required";
    if (!["daily", "weekly", "custom"].includes(frequency)) e.frequency = "Invalid frequency";
    if (category && category.length > 50) e.category = "Category too long";
    const tagsArr = String(tags || "").split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
    if (tagsArr.length > 10) e.tags = "Use up to 10 tags";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      const tagsArr = String(tags || "").split(",").map(t => t.trim().toLowerCase()).filter(Boolean).slice(0,10);
      await onSubmit({ name: name.trim(), category: category.trim(), frequency, tags: tagsArr });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 480 }}>
      <div>
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
        {errors.name && <div style={{ color: "red" }}>{errors.name}</div>}
      </div>
      <div>
        <label>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Select category (optional)</option>
          <option value="Health">Health</option>
          <option value="Fitness">Fitness</option>
          <option value="Reading">Reading</option>
          <option value="Learning">Learning</option>
          <option value="Work">Work</option>
          <option value="Personal">Personal</option>
        </select>
        {errors.category && <div style={{ color: "red" }}>{errors.category}</div>}
      </div>
      <div>
        <label>Frequency</label>
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="custom">Custom</option>
        </select>
        {errors.frequency && <div style={{ color: "red" }}>{errors.frequency}</div>}
      </div>
      <div>
        <label>Tags</label>
        <input placeholder="comma,separated,tags" value={tags} onChange={(e) => setTags(e.target.value)} />
        {errors.tags && <div style={{ color: "red" }}>{errors.tags}</div>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button disabled={submitting} type="submit">{submitting ? "Saving..." : submitLabel}</button>
        {onCancel && (
          <button type="button" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}
