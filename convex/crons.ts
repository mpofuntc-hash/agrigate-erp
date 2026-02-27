import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run weather check every day at 05:00 UTC
crons.daily(
  "weather-check",
  { hourUTC: 5, minuteUTC: 0 },
  internal.activities.checkWeather
);

export default crons;
