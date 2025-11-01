// 📘 autoBook.js
import schedule from "node-schedule";
import { exec } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const timezone = "Asia/Kuala_Lumpur";
console.log("🕛 Scheduler started — waiting for midnight (MYT) to auto-book...");

// === 🧪 RUN IMMEDIATELY IF TEST FLAG IS SET ===
if (process.env.RUN_BOOK_NOW === "1") {
  console.log("🧪 RUN_BOOK_NOW=1 → triggering immediate booking test...");
  exec("node bookRoomCore.js", (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error running bookRoomCore.js: ${error.message}`);
      return;
    }
    if (stderr) console.error(`⚠️ STDERR: ${stderr}`);
    console.log(stdout);
  });
}

// === 🌙 SCHEDULE DAILY MIDNIGHT TASK (MYT) ===
schedule.scheduleJob({ hour: 0, minute: 0, tz: timezone }, () => {
  console.log("🌙 It's midnight MYT — running bookRoomCore.js...");
  exec("node bookRoomCore.js", (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error running bookRoomCore.js: ${error.message}`);
      return;
    }
    if (stderr) console.error(`⚠️ STDERR: ${stderr}`);
    console.log(stdout);
  });
});

// === 🕒 HOURLY HEARTBEAT (OPTIONAL MONITORING) ===
setInterval(() => {
  const now = new Date().toLocaleString("en-MY", { timeZone: timezone });
  console.log(`🕒 Still alive at ${now}`);
}, 1000 * 60 * 60); // every hour