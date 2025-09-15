import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    followerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    followingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      validate: {
        validator: function (v) {
          // prevent self-follow at schema level when possible
          if (!this.followerId || !v) return true;
          return String(this.followerId) !== String(v);
        },
        message: "Cannot follow yourself",
      },
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

// Prevent duplicate follows
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

followSchema.set("toJSON", {
  transform: function (_doc, ret) {
    return ret;
  },
});

export const Follow = mongoose.models.Follow || mongoose.model("Follow", followSchema);
