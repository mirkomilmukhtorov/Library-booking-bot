import schedule from "node-schedule";
import { exec } from "child_process";

// ---------- Timezone ----------
const TZ = "Asia/Kuala_Lumpur";

// ---------- Helper to log the next planned booking ----------
function logPlannedBooking() {
  const DAYS_AHEAD = parseInt(process.env.BOOK_DAYS_AHEAD || "2", 10);
  const ROOM_TYPE = process.env.ROOM_TYPE || "Study Room";
  const ROOM = process.env.TARGET_ROOM || "N202";

  const WEEKLY_SLOTS = {
    Monday: process.env.SLOT_MONDAY || "09:00 - 11:00",
    Tuesday: process.env.SLOT_TUESDAY || "13:00 - 15:00",
    Wednesday: process.env.SLOT_WEDNESDAY || "11:00 - 13:00",
    Thursday: process.env.SLOT_THURSDAY || "09:00 - 11:00",
    Friday: process.env.SLOT_FRIDAY || "11:00 - 13:00",
    Saturday: process.env.SLOT_SATURDAY || "15:00 - 17:00",
    Sunday: process.env.SLOT_SUNDAY || "15:00 - 17:00",
  };

  const target = new Date();
  target.setDate(target.getDate() + DAYS_AHEAD);
  const dayName = target.toLocaleString("en-US", { weekday: "long", timeZone: TZ });
  const dateISO = new Date(target.toLocaleString("en-US", { timeZone: TZ }))
    .toISOString()
    .split("T")[0];
  const TIME = WEEKLY_SLOTS[dayName] || process.env.TARGET_TIME || "09:00 - 11:00";

  console.log(
    `📅 Next booking plan → ${dayName}, ${dateISO} | Room ${ROOM} (${TIME}) in ${ROOM_TYPE}`
  );
}

// ---------- Midnight booking (every day at 00:00 MYT) ----------
const BOOKING_CRON = process.env.BOOKING_CRON || "0 0 * * *"; // minute hour dom mon dow (cron in MYT)
schedule.scheduleJob({ rule: BOOKING_CRON, tz: TZ }, () => {
  console.log("🌙 It's midnight MYT — running bookRoomCore.js...");
  exec("node bookRoomCore.js", (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error running bookRoomCore.js: ${error.message}`);
    }
    if (stderr) console.error(`⚠️ STDERR: ${stderr}`);
    if (stdout) console.log(stdout);
  });
});

// ---------- Session refresh (default: every 3 days at 10:00 MYT) ----------
const REFRESH_CRON = process.env.REFRESH_CRON || "0 10 */3 * *"; // 10:00 every 3 days
schedule.scheduleJob({ rule: REFRESH_CRON, tz: TZ }, () => {
  console.log("🔁 Refreshing session via refreshSession.js...");
  exec("node refreshSession.js", (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error in refreshSession.js: ${error.message}`);
    }
    if (stderr) console.error(`⚠️ STDERR: ${stderr}`);
    if (stdout) console.log(stdout);
  });
});

// ---------- Optional: run booking immediately on startup for testing ----------
if (process.env.RUN_BOOK_NOW === "1") {
  console.log("🧪 RUN_BOOK_NOW=1 → triggering immediate booking for test...");
  exec("node bookRoomCore.js", (error, stdout, stderr) => {
    if (error) console.error(`❌ Error running bookRoomCore.js: ${error.message}`);
    if (stderr) console.error(`⚠️ STDERR: ${stderr}`);
    if (stdout) console.log(stdout);
  });
}

// ---------- Hourly heartbeat ----------
setInterval(() => {
  const now = new Date().toLocaleString("en-MY", { timeZone: TZ });
  console.log(`🕒 Still alive at ${now}`);
}, 60 * 60 * 1000);

// ---------- Startup banner ----------
console.log("🕛 Scheduler started — waiting for events… (MYT)");
logPlannedBooking();