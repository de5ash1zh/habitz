import mongoose from "mongoose";

const checkInSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    habitId: { type: mongoose.Schema.Types.ObjectId, ref: "Habit", required: true, index: true },
    date: {
      type: Date,
      required: true,
      set: (v) => {
        // normalize to UTC midnight
        const d = v instanceof Date ? v : new Date(v);
        if (isNaN(d.getTime())) return v;
        return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      },
    },
    completed: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

checkInSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });

checkInSchema.set("toJSON", {
  transform: function (_doc, ret) {
    return ret;
  },
});

export const CheckIn = mongoose.models.CheckIn || mongoose.model("CheckIn", checkInSchema);
