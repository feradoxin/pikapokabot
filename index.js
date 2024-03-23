const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const { Telegraf } = require('telegraf');
const log4js = require('./log4js.config.js');
const { db } = require('./db/database');
const messageHandler = require('./messageHandler');
const commandHandler = require('./commandHandler');
require('dotenv').config();

// Initialize Telegraf with your bot token from environment variables
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Set up logging
const logger = log4js.getLogger('index');

// Register command handlers
bot.command('start', commandHandler.startHandler);
bot.command('keyword', commandHandler.keywordHandler);
bot.command('listcommands', commandHandler.listCommandsHandler);
bot.command('stop', commandHandler.stopHandler);

// Function to check if a message has already been parsed
async function isMessageParsed(chatId, messageId) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM message_tracking WHERE chat_id = ? AND msg_id = ?';
    db.get(query, [chatId, messageId], (err, row) => {
      if (err) {
        logger.error('Error checking if message is parsed:', err);
        reject(err);
      } else {
        resolve(!!row); // Return true if message is already parsed, false otherwise
      }
    });
  });
}

// Handle incoming messages
bot.on('message', async ctx => {
  const { chat, message_id: messageId } = ctx.message;
  const chatId = chat.id;

  // Check if message has already been parsed
  const parsed = await isMessageParsed(chatId, messageId);
  if (parsed) {
    logger.info(`Message ${messageId} in chat ${chatId} already parsed. Ignoring....`);
    return;
  }

  // Check if bot has been started
  let botState = commandHandler.getBotState();
  if (!botState) {
    logger.info(`Message from ${ctx.message.from.username} in group ${ctx.message.chat.title} while bot inactive. Ignoring...`)
    return;
  }

  // If message is new and not parsed, route it to messageHandler.js
  messageHandler.handleMessage(ctx);
});

logger.info('Bot code started!')
// Start the bot
bot.launch().then(() => {
  logger.info('Bot code exited.');
}).catch(err => {
  logger.error('Error starting bot', err);
});

// Ensure the script keeps running
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));