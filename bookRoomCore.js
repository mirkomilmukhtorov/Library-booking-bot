// 📘 bookRoomCore.js
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import dotenv from "dotenv";

dotenv.config();

// === CONFIG ===
const STORAGE_FILE = "authState.json";
const SCREENSHOT_DIR = "./screenshots";
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR);

// === AUTO-INSTALL CHROMIUM (Render fix) ===
const CHROMIUM_PATH = "/opt/render/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell";
if (!fs.existsSync(CHROMIUM_PATH)) {
  console.log("⚙️ Chromium not found — reinstalling...");
  try {
    execSync("npx playwright install chromium", { stdio: "inherit" });
    console.log("✅ Chromium installed successfully.");
  } catch (err) {
    console.error("❌ Failed to install Chromium:", err.message);
  }
}

// === ROOM SETTINGS ===
const ROOM_TYPE = process.env.ROOM_TYPE || "Silent Study Room";
const TARGET_ROOM = process.env.TARGET_ROOM || "N213";

// Weekly slot schedule (can also move to .env later)
const WEEKLY_SLOTS = {
  Monday: "09:00 - 11:00",
  Tuesday: "13:00 - 15:00",
  Wednesday: "11:00 - 13:00",
  Thursday: "09:00 - 11:00",
  Friday: "11:00 - 13:00",
  Saturday: "15:00 - 17:00",
  Sunday: "15:00 - 17:00",
};

// === CALCULATE TARGET DATE ===
const targetDate = new Date();
targetDate.setDate(targetDate.getDate() + (parseInt(process.env.BOOK_DAYS_AHEAD) || 2));
const dateStr = targetDate.toISOString().split("T")[0];
const dayName = targetDate.toLocaleString("en-US", { weekday: "long" });
const timeSlot = WEEKLY_SLOTS[dayName] || "09:00 - 11:00";

console.log("🚀 Starting Library Booking for " + ROOM_TYPE + "...");
console.log(`🗓️ Booking planned for ${dayName}, ${dateStr} at ${timeSlot}`);

// === MAIN FUNCTION ===
(async () => {
  let browser;
  const confirmPath = path.join(SCREENSHOT_DIR, `booking_${dateStr}.png`);
  const errorPath = path.join(SCREENSHOT_DIR, `error_${dateStr}.png`);

  try {
    // Use saved session if available
    if (fs.existsSync(STORAGE_FILE)) {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({ storageState: STORAGE_FILE });
      const page = await context.newPage();

      console.log("🔑 Using saved login session...");
      await page.goto("https://eservices.xmu.edu.my/space-booking/library-space-booking", { waitUntil: "load" });

      // Verify session still valid
      if (page.url().includes("authenticate")) {
        throw new Error("Session expired — please log in again using refreshSession.js");
      }

      // Booking logic
      console.log("📖 Opening booking page...");
      await page.waitForSelector("#kt_app_content_container", { timeout: 10000 });

      // Here you can extend your selection logic
      await page.waitForTimeout(1500);
      await page.screenshot({ path: confirmPath, fullPage: true });
      console.log(`📸 Screenshot saved: ${confirmPath}`);
    } else {
      console.log("❌ No saved session found — run refreshSession.js first to log in.");
      return;
    }
  } catch (err) {
    console.error("❌ Booking failed:", err.message);
    try {
      await page.screenshot({ path: errorPath, fullPage: true });
      console.log(`📸 Error screenshot saved: ${errorPath}`);
    } catch {}
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
    console.log("🏁 Booking process finished.");
  }

  // --- Auto-delete old screenshots ---
  const files = fs.readdirSync(SCREENSHOT_DIR);
  const now = Date.now();
  files.forEach((file) => {
    const filePath = path.join(SCREENSHOT_DIR, file);
    const stats = fs.statSync(filePath);
    const ageDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
    if (ageDays > 2) {
      fs.unlinkSync(filePath);
      console.log(`🧹 Deleted old screenshot: ${file}`);
    }
  });
})();