import schedule from 'node-schedule';
import { exec } from 'child_process';

// Malaysia = UTC + 8
// Cron syntax: minute hour * * *  → 0 0 = 00:00
const rule = new schedule.RecurrenceRule();
rule.tz = 'Asia/Kuala_Lumpur';   // ensure correct timezone
rule.hour = 0;                   // 00:00
rule.minute = 0;

console.log('🕛 Scheduler started — waiting for midnight (MYT) to auto-book...');

schedule.scheduleJob(rule, () => {
  const now = new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' });
  console.log(`⏰ Triggered booking at ${now}`);

  // Run bookRoomCore.js as a separate Node process
  exec('node bookRoomCore.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Booking process failed: ${error.message}`);
      return;
    }
    console.log(stdout);
    if (stderr) console.error(stderr);
    console.log('✅ Booking job completed.\n');
  });
});