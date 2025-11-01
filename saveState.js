process.env.PLAYWRIGHT_BROWSERS_PATH = "0";
process.env.PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = "true";

import { chromium } from 'playwright';
import dotenv from 'dotenv';
dotenv.config();

const STORAGE_FILE = 'authState.json';

(async () => {
  console.log('🔑 Opening XMUM login page...');
  // const browser = await chromium.launch({ headless: true, slowMo: 50 });
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://eservices.xmu.edu.my/', { waitUntil: 'networkidle' });

  console.log('🧭 Please log in manually (enter username, password, solve CAPTCHA)...');
  console.log('➡️ After login, click **Space Booking → Library Space Booking**, then wait.');
  console.log('✅ When you reach the booking page, the session will save automatically.');

  // Wait until user is actually inside the Library Booking page
  await page.waitForFunction(
    () =>
      window.location.href.includes('space-booking/library-space-booking') ||
      document.querySelector('h1,h2,h3')?.innerText?.includes('Library'),
    { timeout: 0 }
  );

  console.log('✅ Detected Library Booking page. Saving full session...');
  await context.storageState({ path: STORAGE_FILE });
  console.log(`💾 Session saved to ${STORAGE_FILE}`);

  await browser.close();
  process.exit(0);
})();