import mongoose from "mongoose";

const habitSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
    category: { type: String, trim: true, maxlength: 50, default: "" },
    frequency: { type: String, enum: ["daily", "weekly", "custom"], default: "daily", required: true },
    tags: {
      type: [String],
      default: [],
      set: (arr) => Array.isArray(arr) ? arr.map(t => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 10) : [],
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

habitSchema.index({ userId: 1, name: 1 }, { unique: true });
habitSchema.index({ userId: 1, category: 1 });
habitSchema.index({ userId: 1, tags: 1 });

habitSchema.set("toJSON", {
  transform: function (_doc, ret) {
    return ret;
  },
});

export const Habit = mongoose.models.Habit || mongoose.model("Habit", habitSchema);
