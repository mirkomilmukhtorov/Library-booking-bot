import { chromium } from "playwright";
import dotenv from "dotenv";
dotenv.config();

console.log(
  "Loaded ENV:",
  process.env.XMU_USER,
  process.env.TARGET_ROOM,
  process.env.TARGET_TIME
);

const STORAGE_FILE = "authState.json";
const BOOK_URL =
  "https://eservices.xmu.edu.my/space-booking/library-space-booking";

// Environment or defaults
const ROOM = process.env.TARGET_ROOM || "N202";
const TIME = process.env.TARGET_TIME || "09:00 - 11:00";
const DAYS_AHEAD = 2; // today + 2 days = 29 Oct if today is 27 Oct

function pad2(n) {
  return String(n).padStart(2, "0");
}
function formatDDMMYYYY(d) {
  return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
}

(async () => {
  console.log("🚀 Starting Library Room booking...");
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ storageState: STORAGE_FILE });
  const page = await context.newPage();

  try {
    // --- OPEN BOOKING PAGE ---
    await page.goto(BOOK_URL, { waitUntil: "networkidle" });
    console.log("✅ Logged in session opened");

    // --- OPEN FLATPICKR CALENDAR AND SELECT DATE ---
    const target = new Date();
    target.setDate(target.getDate() + DAYS_AHEAD);
    const dayNum = target.getDate(); // e.g. 29
    const targetLabel = formatDDMMYYYY(target); // e.g. 29-10-2025
    console.log(`📅 Setting booking date to ${targetLabel}`);

    // Click the date input to open calendar
    await page.waitForSelector("#booking_date", { timeout: 10000 });
    await page.click("#booking_date");

    // Wait for the calendar popup to appear
    await page.waitForSelector(".flatpickr-days", { timeout: 5000 });

    // Click the visible day cell for our target date
    const dayCell = page.locator(
      ".flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)",
      { hasText: String(dayNum) }
    );
    await dayCell.first().click();
    console.log(`✅ Picked ${targetLabel} in the calendar`);

    // Wait until the input’s value updates
    await page.waitForFunction(
      ([sel, val]) => document.querySelector(sel)?.value.includes(val),
      ["#booking_date", targetLabel]
    );

    // --- WAIT FOR ROOM LIST TO REFRESH ---
    await page.waitForSelector("table tbody tr", { timeout: 15000 });
    console.log("✅ Room list loaded for selected date");

    // --- FIND ROOM ROW ---
    const row = page.locator("tr", { hasText: ROOM });
    await row.waitFor({ timeout: 15000 });
    console.log(`🏠 Found room: ${ROOM}`);

    // --- CLICK TIME SLOT BUTTON ---
    const slotButton = row.locator(`button:has-text("${TIME}")`);
    await slotButton.waitFor({ timeout: 10000 });
    await slotButton.click();
    console.log(`🕒 Clicked time slot: ${TIME}`);

    // --- CONFIRM BOOKING ---
    const yesButton = page.locator('button:has-text("Yes")');
    await yesButton.waitFor({ timeout: 5000 });
    await yesButton.click();
    console.log("✅ Confirmed booking");

    // --- TAKE SCREENSHOT ---
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "booking_confirmation.png", fullPage: true });
    console.log("📸 Screenshot saved as booking_confirmation.png");
  } catch (e) {
    console.error("❌ Booking failed:", e.message);
    try {
      await page.screenshot({ path: "booking_error.png", fullPage: true });
      console.log("📸 Saved error screenshot: booking_error.png");
    } catch {}
  } finally {
    await browser.close();
    console.log("🏁 Booking process finished.");
  }
})();
