import schedule from "node-schedule";
import { exec } from "child_process";

const timezone = "Asia/Kuala_Lumpur";
console.log("🕛 Scheduler started — waiting for midnight (MYT) to auto-book...");

// Schedule the booking task at 00:00 MYT every day
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

// --- Optional: hourly heartbeat log ---
setInterval(() => {
  const now = new Date().toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" });
  console.log(`🕒 Still alive at ${now}`);
}, 1000 * 60 * 60); // every hour