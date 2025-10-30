import schedule from "node-schedule";
import { exec, execSync } from "child_process";
import fs from "fs";

const timezone = "Asia/Kuala_Lumpur";

// ✅ 1. Ensure Playwright Chromium exists before scheduler starts
try {
  const chromiumPath = "/opt/render/.cache/ms-playwright/chromium-1194";
  if (!fs.existsSync(chromiumPath)) {
    console.log("⚙️ Chromium not found — reinstalling...");
    execSync("npx playwright install chromium", { stdio: "inherit" });
    console.log("✅ Chromium installed successfully.");
  } else {
    console.log("✅ Chromium already installed.");
  }
} catch (err) {
  console.error("❌ Failed to reinstall Chromium:", err.message);
}

console.log("🕛 Scheduler started — waiting for midnight (MYT) to auto-book...");

// ✅ 2. Schedule the booking task at 00:00 MYT every day
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

// ✅ 3. Optional: hourly heartbeat log
setInterval(() => {
  const now = new Date().toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" });
  console.log(`🕒 Still alive at ${now}`);
}, 1000 * 60 * 60); // every hour