import TelegramBot from 'node-telegram-bot-api';
import { exec } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "👋 Welcome to the XMUM Library Booking Bot!\n\nUse this format:\n`/book ROOM TIME`\nExample:\n`/book N202 09:00-11:00`",
    { parse_mode: 'Markdown' }
  );
});

// Example: /book N202 09:00-11:00
bot.onText(/\/book (.+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const room = match[1];
  const time = match[2];

  bot.sendMessage(chatId, `🕓 Booking request received!\nRoom: ${room}\nTime: ${time}\nBooking for 2 days ahead...`);

  exec(
    `TARGET_ROOM=${room} TARGET_TIME="${time}" node bookRoomCore.js`,
    (error, stdout, stderr) => {
      if (error) {
        bot.sendMessage(chatId, `❌ Booking failed:\n${error.message}`);
        return;
      }
      bot.sendMessage(chatId, `✅ Booking complete!\n${stdout}`);
    }
  );
});