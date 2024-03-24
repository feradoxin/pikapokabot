# Pika Poka Helper Bot

## Introduction
Poka Pika Helper Bot is a Telegram bot built with Node.js that helps manage orders and stores them in a Google Sheets spreadsheet. It parses new messages sent in chat / group looking for messages with a keyword, i.e. "createneworder", and then extracts the order information and sorts them for input into Google Sheets.

## Prerequisites
Before you begin, ensure you have the following installed on your system:
- Node.js
- npm (Node Package Manager)
- Git

## Installation

1. **Install prequisite packages**

Installing prerequisite packages:

    ```bash
    sudo apt update
    sudo apt install curl git
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install nodejs
    ```

Checking node.js version to verify installation:

    ```bash
    node -v # v18.14.0  # Your version might be newer.
    ```
    

Check NPM version:

    ```bash
    npm -v # 9.3.1  # Your version might be newer.
    ```
    

2. **Clone the repository:**

    ```bash
    git clone https://github.com/feradoxin/pikapokabot.git
    ```

3. **Install dependencies:**

    ```bash
    cd pikapokabot
    npm install
    ```

4. **Set up Google Sheets API:**
    - Follow the [Google Sheets API Quickstart Guide](https://developers.google.com/sheets/api/quickstart/nodejs) to enable the Google Sheets API and download the `credentials.json` file.
    - Place the `credentials.json` file in the root directory of the project.

5. **Set up environment variables:**
    - Create a `.env` file in the root directory of the project:
        
        ```bash
        cp .env.example .env
        ```
        
    - Edit the following variables in the `.env` file:

        - TELEGRAM_BOT_TOKEN=your_telegram_bot_token
        - GOOGLE_CLIENT_EMAIL=your_google_client_email
        - GOOGLE_PRIVATE_KEY=your_google_private_key
        - GSHEET_ID=your_google_spreadsheet_id

    - Create a `config.json` file in the root directory of the project:
    
        `
        cp config.json.example config.json
        ```

    - Edit the JSON file to enable admin accounts to command the bot
    
        - Replace admin1 and admin2 with the username of admins (telegram handle @admin1 or @admin2)
        - Remember to remove the "@" before the username
        - Add / remove as needed
        - You can configure the keyword here or by calling /keyword in chat
       

## Configuration - Check the following
- For `.env`:

    - Replace `your_telegram_bot_token` with your Telegram bot token obtained from the BotFather.
    - Replace `your_google_client_email` and `your_google_private_key` with your Google Service Account credentials.
    - Replace `your_google_spreadsheet_id` with the ID of the Google Sheets spreadsheet where you want to store orders.

- For `conf.json`:

    - Replace `admin1` and `admin2` with the username of admins (telegram handle @admin1 or @admin2).
    - Remember to remove the "@" before the username
    - Add / remove admin accounts as needed
    - You can configure the `keyword` here or by calling `/keyword` in chat

- For `pikapokabot.service`:

    - Edit path in `WorkingDirectory` and `ExecStart`

- DEBUG mode:

    - In `log4js.config.js`, change the logging level:

        messageHandler: { appenders: ['file', 'console'], level: 'info' } // Log level: info
        messageHandler: { appenders: ['file', 'console'], level: 'debug' } // Log level: debug


## Running the Bot
Copy the system service file to systemd and enable the service.
    
    sudo cp ./pikapokabot.service /etc/systemd/system/pikapokabot.service
    sudo systemctl enable pikapokabot.service
    sudo systemctl start pikapokabot.service
    

## License

MIT License

Copyright (c) 2022 Sam Wong (@feradoxin)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:


The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.