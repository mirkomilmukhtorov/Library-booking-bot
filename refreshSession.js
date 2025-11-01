import { chromium } from "playwright";
import dotenv from "dotenv";
dotenv.config();

const STORAGE_FILE = "authState.json";
const LOGIN_URL = "https://eservices.xmu.edu.my/login";
const DASHBOARD_URL = "https://eservices.xmu.edu.my/dashboard";

// 🗓 Load weekly slots from .env (same logic as bookRoomCore)
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

(async () => {
  console.log("🔁 Refreshing XMUM session...");

  // --- Launch browser ---
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const context = await browser.newContext({ storageState: STORAGE_FILE });
  const page = await context.newPage();

  try {
    await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
    console.log("🌐 Login page loaded — checking session...");

    // --- Detect if session is still valid ---
    if (page.url().includes("login")) {
      console.warn(
        "⚠️ Session expired — please log in manually next time using saveState.js"
      );
    } else {
      console.log("✅ Session is still valid, refreshing cookies...");

      // --- Visit dashboard to extend session ---
      await page.goto(DASHBOARD_URL, { waitUntil: "networkidle" });
      await context.storageState({ path: STORAGE_FILE });
      console.log("💾 Session refreshed successfully!");
    }

    // --- Predict the next booking info ---
    const target = new Date();
    target.setDate(target.getDate() + DAYS_AHEAD);
    const targetDay = target.toLocaleString("en-US", { weekday: "long" });
    const TIME =
      WEEKLY_SLOTS[targetDay] || process.env.TARGET_TIME || "09:00 - 11:00";
    const nextBookingDate = target.toISOString().split("T")[0];

    console.log(
      `📅 Next booking planned for ${targetDay}, ${nextBookingDate}, Room ${ROOM} (${TIME}) in ${ROOM_TYPE}`
    );
  } catch (err) {
    console.error("❌ Session refresh failed:", err.message);
  } finally {
    await browser.close();
    console.log("🏁 Refresh process finished.");
  }
})();