import { chromium } from "playwright";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();

const STORAGE_FILE = "authState.json";
const BOOK_URL = "https://eservices.xmu.edu.my/space-booking/library-space-booking";

// ⏰ Load weekly slots from .env or use defaults
const WEEKLY_SLOTS = {
  Monday: process.env.SLOT_MONDAY || "09:00 - 11:00",
  Tuesday: process.env.SLOT_TUESDAY || "13:00 - 15:00",
  Wednesday: process.env.SLOT_WEDNESDAY || "11:00 - 13:00",
  Thursday: process.env.SLOT_THURSDAY || "09:00 - 11:00",
  Friday: process.env.SLOT_FRIDAY || "11:00 - 13:00",
  Saturday: process.env.SLOT_SATURDAY || "15:00 - 17:00",
  Sunday: process.env.SLOT_SUNDAY || "15:00 - 17:00",
};

const ROOM_TYPE = process.env.ROOM_TYPE || "Study Room";
const ROOM = process.env.TARGET_ROOM || "N202";
const DAYS_AHEAD = parseInt(process.env.BOOK_DAYS_AHEAD || "2", 10);

// 🧠 Helper functions
function pad2(n) {
  return String(n).padStart(2, "0");
}
function formatDDMMYYYY(d) {
  return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
}

// 📁 Ensure screenshots directory exists
const SCREENSHOT_DIR = path.resolve("./screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR);

(async () => {
  console.log(`🚀 Starting Library Booking for ${ROOM_TYPE}...`);

  // --- Determine booking day & time slot ---
  const target = new Date();
  target.setDate(target.getDate() + DAYS_AHEAD);
  const targetDay = target.toLocaleString("en-US", { weekday: "long" });
  const TIME =
    WEEKLY_SLOTS[targetDay] || process.env.TARGET_TIME || "09:00 - 11:00";

  const dateLabel = formatDDMMYYYY(target);
  console.log(`🗓️ Booking planned for ${targetDay}, ${dateLabel} at ${TIME}`);

  // --- Launch browser ---
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const context = await browser.newContext({ storageState: STORAGE_FILE });
  const page = await context.newPage();

  try {
    // --- Open booking page ---
    await page.goto(BOOK_URL, { waitUntil: "networkidle" });
    console.log("✅ Logged in session opened");

    // --- Switch to correct room type tab ---
    await page.waitForSelector('a[role="tab"]', { timeout: 20000 });
    const tab = page.getByRole("tab", { name: ROOM_TYPE, exact: true });
    await tab.click();
    console.log(`🏛 Switched to "${ROOM_TYPE}" tab`);

    // --- Select booking date ---
    await page.waitForSelector("#booking_date", { timeout: 10000 });
    await page.click("#booking_date");
    await page.waitForSelector(".flatpickr-days", { timeout: 5000 });
    const dayCell = page.locator(
      ".flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)",
      { hasText: String(target.getDate()) }
    );
    await dayCell.first().click();
    console.log(`📅 Picked ${dateLabel} in the calendar`);

    await page.waitForFunction(
      ([sel, val]) => document.querySelector(sel)?.value.includes(val),
      ["#booking_date", dateLabel]
    );
    console.log("✅ Booking date input updated");

    // --- Wait for room list ---
    await page.waitForSelector("table tbody tr", { timeout: 15000 });
    const row = page.locator("tr", { hasText: ROOM });
    await row.waitFor({ timeout: 15000 });
    console.log(`🏠 Found room: ${ROOM}`);

    // --- Click the time slot ---
    const slot = row.locator(`button:has-text("${TIME}")`);
    await slot.waitFor({ timeout: 10000 });
    await slot.click();
    console.log(`🕒 Clicked time slot: ${TIME}`);

    // --- Confirm booking ---
    const yesButton = page.locator('button:has-text("Yes")');
    await yesButton.waitFor({ timeout: 5000 });
    await yesButton.click();
    console.log(`✅ Confirmed booking for ${ROOM} (${TIME}) in ${ROOM_TYPE}`);

    // --- Screenshot success ---
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const confirmPath = path.join(SCREENSHOT_DIR, `booking_${dateStr}.png`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: confirmPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${confirmPath}`);
  } catch (err) {
    console.error("❌ Booking failed:", err.message);
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const errorPath = path.join(SCREENSHOT_DIR, `error_${dateStr}.png`);
    try {
      await page.screenshot({ path: errorPath, fullPage: true });
      console.log(`📸 Error screenshot saved: ${errorPath}`);
    } catch {}
  }

  // 🧹 Delete screenshots older than 2 days
  const now = Date.now();
  for (const file of fs.readdirSync(SCREENSHOT_DIR)) {
    const filePath = path.join(SCREENSHOT_DIR, file);
    const ageDays =
      (now - fs.statSync(filePath).mtimeMs) / (1000 * 60 * 60 * 24);
    if (ageDays > 2) {
      fs.unlinkSync(filePath);
      console.log(`🧹 Deleted old screenshot: ${file}`);
    }
  }

  await context.storageState({ path: STORAGE_FILE });
  await browser.close();
  console.log("🏁 Booking process finished.");
})();