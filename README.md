# Discord Ticket Bot

![Discord.js Version](https://img.shields.io/badge/discord.js-v14-blue.svg?logo=discord)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Beta](https://img.shields.io/badge/status-Beta-orange.svg)

> **Disclaimer:** This ticket system is currently in **beta**. It may still have bugs and incomplete features. Use it at your own discretion and report any issues to help improve the project.

## Features

- Easy setup with slash commands
- One ticket per user limit
- Customizable embed messages and button labels
- Staff role management
- Organized ticket channels

## Prerequisites

- Node.js 16.9.0 or newer
- npm (comes with Node.js)
- A Discord Bot Token ([Guide to create a Discord Bot](https://discordjs.guide/preparations/setting-up-a-bot-application.html))

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/fleurdefontaine/discord-ticket-bot.git
   cd discord-ticket-bot
   ```

2. Install dependencies:
   ```bash
   npm i
   ```

3. Configure the bot:
   - Open Folder `src/`
   - Rename `config.example.json` to `config.json`
   - Fill in your bot token and other required fields

4. Start the bot:
   ```bash
   npm start
   ```

## Configuration

Edit `config.json` to customize your bot:

```json
{
  "token": "YOUR_BOT_TOKEN",
  "guildId": "YOUR_GUILD_ID",
  "ticketCategory": "TICKET_CATEGORY_ID",
  "staffRoles": ["STAFF_ROLE_ID_1", "STAFF_ROLE_ID_2"],
  "ticketLimit": 1,
  "settingsChannelId": "SETTINGS_CHANNEL_ID",
  "embedDescription": "Click the button below to create a new support ticket.",
  "buttonLabel": "Create Ticket"
}
```

## Commands

### /setup

Sets up the ticket system in a specified channel.

Usage:
```
/setup channel:#channel category:#category description:"Your description" button_label:"Create Ticket"
```

## Project Structure

```bash
discord-ticket-bot/
├── src/
│   ├── events/
│   │   ├── ready.js
│   │   └── interactionCreate.js
│   ├── commands/
│   │   └── setup.js
│   ├── utils/
│   │   └── ticketUtils.js
│   └── config.json
├── index.js
├── package.json
└── README.md
```

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/discord-ticket-system/issues).

## License

This project is [MIT](https://choosealicense.com/licenses/mit/)