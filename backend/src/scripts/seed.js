import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Habit } from "../models/Habit.js";
import { CheckIn } from "../models/CheckIn.js";
import { Follow } from "../models/Follow.js";

dotenv.config();

function utcDate(y, m, d) {
  return new Date(Date.UTC(y, m, d));
}

function todayUTC() {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function main() {
  await connectDB(process.env.MONGODB_URI);

  const shouldWipe = process.argv.includes("--wipe");
  if (shouldWipe) {
    await Promise.all([
      User.deleteMany({}),
      Habit.deleteMany({}),
      CheckIn.deleteMany({}),
      Follow.deleteMany({}),
    ]);
  }

  // Create users
  const usersData = [
    { username: "alice", email: "alice@example.com", password: "password123" },
    { username: "bob", email: "bob@example.com", password: "password123" },
    { username: "carol", email: "carol@example.com", password: "password123" },
  ];

  const users = [];
  for (const u of usersData) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(u.password, salt);
      user = await User.create({ username: u.username, email: u.email, password: hash });
    }
    users.push(user);
  }

  // Create habits with categories/tags and mixed frequencies
  const habitsByUser = new Map();
  for (const user of users) {
    const specs = [
      { name: "Morning Run", category: "Fitness", frequency: "daily", tags: ["morning", "cardio"] },
      { name: "Read 20 pages", category: "Reading", frequency: "daily", tags: ["focus", "books"] },
      { name: "Weekly Review", category: "Work", frequency: "weekly", tags: ["planning"] },
      { name: "Meditation", category: "Health", frequency: "daily", tags: ["mindfulness"] },
    ];
    const userHabits = [];
    for (const s of specs) {
      let h = await Habit.findOne({ userId: user._id, name: s.name });
      if (!h) {
        h = await Habit.create({ userId: user._id, ...s });
      }
      userHabits.push(h);
    }
    habitsByUser.set(user._id.toString(), userHabits);
  }

  // Seed check-ins for last 90 days with gaps, duplicates, and a future date edge case
  const base = todayUTC();
  for (const user of users) {
    const userHabits = habitsByUser.get(user._id.toString());
    for (const habit of userHabits) {
      // Remove old checkins for deterministic seeding
      await CheckIn.deleteMany({ userId: user._id, habitId: habit._id });

      // Daily habits: every other day complete, with a few streak bursts, add a duplicate edge
      if (habit.frequency === "daily") {
        for (let i = 0; i < 90; i++) {
          const d = addDays(base, -i);
          const completed = (i % 2 === 0) || (i < 5); // recent small streak
          if (completed) {
            await CheckIn.create({ userId: user._id, habitId: habit._id, date: d, completed: true });
            if (i === 10) {
              // duplicate same day edge
              await CheckIn.create({ userId: user._id, habitId: habit._id, date: d, completed: true }).catch(() => {});
            }
          }
        }
        // future date edge
        await CheckIn.create({ userId: user._id, habitId: habit._id, date: addDays(base, 1), completed: true }).catch(() => {});
      }

      // Weekly habits: one per week for the last 16 weeks, with a gap
      if (habit.frequency === "weekly") {
        for (let w = 0; w < 16; w++) {
          if (w === 6) continue; // gap week
          const d = addDays(base, -7 * w);
          await CheckIn.create({ userId: user._id, habitId: habit._id, date: d, completed: true });
        }
      }
    }
  }

  // Follows: alice follows bob and carol
  const alice = users[0];
  for (let i = 1; i < users.length; i++) {
    await Follow.findOneAndUpdate(
      { followerId: alice._id, followingId: users[i]._id },
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log("Seed complete.");
  await mongoose.connection.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
