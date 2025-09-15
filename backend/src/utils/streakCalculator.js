import { CheckIn } from "../models/CheckIn.js";

function normalizeDay(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function sundayOfWeek(date) {
  const d = normalizeDay(date);
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - day);
  return d;
}

export async function getDailyStreak({ userId, habitId }) {
  const today = normalizeDay(new Date());
  const since = new Date(today);
  since.setUTCDate(today.getUTCDate() - 365);
  const items = await CheckIn.find({ userId, habitId, date: { $gte: since } }).select("date completed").lean();
  const set = new Set(items.filter(i => i.completed).map(i => normalizeDay(i.date).toISOString()));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    if (set.has(d.toISOString())) streak += 1; else break;
  }
  // longest
  let longest = 0, current = 0;
  const days = [...set].map(s => new Date(s)).sort((a,b)=>a-b);
  for (let i=0;i<days.length;i++) {
    if (i===0) { current = 1; longest = 1; continue; }
    const prev = days[i-1];
    const cur = days[i];
    const nextOfPrev = new Date(prev);
    nextOfPrev.setUTCDate(prev.getUTCDate()+1);
    if (nextOfPrev.getTime()===cur.getTime()) { current+=1; longest=Math.max(longest,current);} else { current=1; longest=Math.max(longest,1); }
  }
  return { currentStreak: streak, longestStreak: longest };
}

export async function getWeeklyStreak({ userId, habitId }) {
  const today = new Date();
  const thisWeek = sundayOfWeek(today);
  const since = new Date(thisWeek);
  since.setUTCDate(thisWeek.getUTCDate() - 7*52);
  const items = await CheckIn.find({ userId, habitId, date: { $gte: since } }).select("date completed").lean();
  const weeks = new Set(items.filter(i=>i.completed).map(i => sundayOfWeek(i.date).toISOString()));
  let streak = 0;
  for (let i = 0; i < 520; i++) {
    const w = new Date(thisWeek);
    w.setUTCDate(thisWeek.getUTCDate() - 7*i);
    if (weeks.has(w.toISOString())) streak += 1; else break;
  }
  // longest approx by scanning
  const weekDates = [...weeks].map(s=>new Date(s)).sort((a,b)=>a-b);
  let longest = 0, current = 0;
  for (let i=0;i<weekDates.length;i++) {
    if (i===0) { current=1; longest=1; continue; }
    const prev = weekDates[i-1];
    const cur = weekDates[i];
    const nextOfPrev = new Date(prev);
    nextOfPrev.setUTCDate(prev.getUTCDate()+7);
    if (nextOfPrev.getTime()===cur.getTime()) { current+=1; longest=Math.max(longest,current);} else { current=1; longest=Math.max(longest,1); }
  }
  return { currentStreak: streak, longestStreak: longest };
}

export async function getCompletionRate({ userId, habitId, days = 7 }) {
  const today = normalizeDay(new Date());
  const from = new Date(today);
  from.setUTCDate(today.getUTCDate() - (days-1));
  const items = await CheckIn.find({ userId, habitId, date: { $gte: from, $lte: today } }).select("completed").lean();
  const done = items.filter(i=>i.completed).length;
  return { days, done, completionRate: Math.round((done/Math.max(days,1))*100) };
}
