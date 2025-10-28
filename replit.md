# Library Booking Bot

## Overview
This is an automated library room booking system for XMUM (Xiamen University Malaysia). The bot uses Playwright to automate the booking process and can be triggered via:
- **Scheduled booking**: Runs automatically at midnight MYT to book rooms
- **Telegram bot**: Manual booking through Telegram commands

## Project Structure
- `autoBook.js` - Main scheduler that runs booking at midnight MYT (00:00)
- `telegramBot.js` - Telegram bot interface for manual booking commands
- `bookRoomCore.js` - Core Playwright automation script for booking rooms
- `saveState.js` - Helper script to save authentication session

## Dependencies
- **playwright** - Browser automation for booking process
- **node-schedule** - Scheduling jobs at specific times
- **node-telegram-bot-api** - Telegram bot integration
- **dotenv** - Environment variable management

## Required Environment Variables
- `TELEGRAM_TOKEN` - Your Telegram bot token from BotFather
- `ROOM_TYPE` - Type of room (e.g., "Discussion Room", "Study Room")
- `TARGET_ROOM` - Specific room number (e.g., "N202")
- `TARGET_TIME` - Default time slot (e.g., "09:00 - 11:00")
- `BOOK_DAYS_AHEAD` - How many days in advance to book (default: 2)

## Setup Instructions

### 1. First-time Authentication
Run the authentication script to save your login session:
```bash
npm run save-state
```
This will open a browser where you need to:
1. Log in to XMUM eServices
2. Navigate to Space Booking → Library Space Booking
3. Wait for the session to be saved automatically

### 2. Running the Bot

**Auto-scheduler (runs at midnight MYT):**
```bash
npm start
```

**Telegram bot:**
```bash
npm run telegram
```

**Manual booking:**
```bash
npm run book
```

## Usage
Once the Telegram bot is running, use these commands:
- `/start` - Get welcome message and instructions
- `/book ROOM TIME` - Book a specific room and time
  - Example: `/book N202 09:00-11:00`

## How It Works
1. The bot uses saved authentication cookies from `authState.json`
2. It automatically navigates to the booking page
3. Selects the desired date, room, and time slot
4. Confirms the booking
5. Takes a screenshot for verification
6. Logs the result to `logs.txt`

## Recent Changes
- **2025-10-28**: Initial setup in Replit environment
  - Configured for running as a persistent background service
  - Added environment variable documentation
  - Set browser to headless mode for Replit compatibility
  - Installed Playwright system dependencies
  - Configured auto-scheduler workflow

## Notes
- Screenshots are saved in `screenshots/` directory (auto-deleted after 2 days)
- All bookings are logged to `logs.txt`
- Browser runs in non-headless mode for debugging
- Session cookies are refreshed after each booking to prevent expiration
