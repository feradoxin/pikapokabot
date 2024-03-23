const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const log4js = require('./log4js.config.js');

// Create a logger instance for info logging
const logger = log4js.getLogger('commandHandler');

// Set initial bot state
let botState = false;
function getBotState() {
  return botState
}

// Command handler for /start
async function startHandler(ctx) {
  try {
    // Check if the user is allowed to use the keyword command
    const allowedUserIds = await getAllowedUserIds();
    const userId = ctx.message.from.username;
    
    if (!allowedUserIds.includes(userId)) {
      logger.warn('Unauthorized call to bot for /start');
      return ctx.reply('Sorry! You are not authorized to use this command.'); // If user is not authorized, return error message
    }
    // Start handling messages
    botState = true;
    logger.info(`/start command called via chat. botState set to ${botState}.`);
    return ctx.reply(`This little helper is ready to work!`);
  } catch (error) {
    logger.error('Error starting bot:', error);
    return ctx.reply('An error occurred while starting the bot. Please try again later.');
  }
}

// Command handler for /stop
async function stopHandler(ctx) {
  try {
    // Check if the user is allowed to use the keyword command
    const allowedUserIds = await getAllowedUserIds();
    const userId = ctx.message.from.username;
    
    if (!allowedUserIds.includes(userId)) {
      logger.warn('Unauthorized call to bot for /stop.');
      return ctx.reply('Sorry! You are not authorized to use this command.'); // If user is not authorized, return error message
    }
    // Start handling messages
    botState = false;
    logger.info(`/stop command called via chat. botState set to ${botState}.`);
    return ctx.reply(`This little helper is going to bed!`);
  } catch (error) {
    logger.error('Error updating keyword:', error);
    return ctx.reply('An error occurred while stopping the bot. Please try again later.');
  }
}

// Command handler for /keyword
async function keywordHandler(ctx) {
  const message = ctx.message.text.replace('/keyword', '').trim(); // Extract the keyword from the message

  if (!message) {
    const currentKeyword = await getCurrentKeyword();
    logger.info('/keyword command called without defining new keyword. Replying existing keyword in "conf.json".')
    return ctx.reply(`The current keyword is "${currentKeyword}". Use /keyword new_keyword to update keyword.`); // If no keyword provided, return error message
  }

  try {
    // Check if the user is allowed to use the keyword command
    const allowedUserIds = await getAllowedUserIds();
    const userId = ctx.message.from.username;
    
    if (!allowedUserIds.includes(userId)) {
      logger.warn('Unauthorized call to bot for /keyword.');
      return ctx.reply('You are not authorized to use this command.'); // If user is not authorized, return error message
    }

    // Update the keyword in config.json
    await updateKeyword(message);

    // Send confirmation message
    logger.info(`/keyword command called via chat with "${message}". Keyword updated to "${message}".`);
    return ctx.reply(`Keyword "${message}" updated successfully.`);
  } catch (error) {
    logger.error('Error updating keyword:', error);
    return ctx.reply('An error occurred while updating keyword. Please try again later.');
  }
}

// Command handler for /listcommands
async function listCommandsHandler(ctx) {
  const message = "Available commands:\n" +
                  "/start - Start the bot and handle incoming messages.\n" +
                  "/stop - Stop the bot from handling incoming messages.\n" +
                  "/keyword [new_keyword] - Update bot's keyword.\n" +
                  "/listcommands - List all available commands.";
  return ctx.reply(message);
}

// Function to read config.json file
async function readConfig() {
  return new Promise((resolve, reject) => {
    const configPath = path.join(__dirname, 'config.json');
    fs.readFile(configPath, 'utf8', (err, data) => {
      if (err) {
        logger.error('Error in readConfig:', err);
        reject(err);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
}

// Function to write config.json file
async function writeConfig(config) {
  return new Promise((resolve, reject) => {
    const configPath = path.join(__dirname, 'config.json');
    const configString = JSON.stringify(config, null, 2);
    fs.writeFile(configPath, configString, 'utf8', err => {
      if (err) {
        logger.error('Error in writeConfig:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Function to get allowed user IDs from config.json
async function getAllowedUserIds() {
  const config = await readConfig(); // Read configuration from config.json
  return config.admins; // Assuming 'admins' parameter exists in config.json
}

// Function to get current keyword from config.json
async function getCurrentKeyword() {
  const config = await readConfig();
  return config.keyword;
}

// Function to update keyword in config.json
async function updateKeyword(keyword) {
  const config = await readConfig(); // Read configuration from config.json
  config.keyword = keyword; // Update keyword in config object
  await writeConfig(config); // Write updated config back to config.json
}

module.exports = {
  startHandler,
  stopHandler,
  keywordHandler,
  listCommandsHandler,
  getBotState
};