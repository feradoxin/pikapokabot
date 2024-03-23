const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const log4js = require('./log4js.config.js');
const { db } = require('./db/database');
const { generateOrderID, findExistingOrders, processOrder, storeOrder, storeOrderItems } = require('./orderProcessing');
const { addOrderToGoogleSheets } = require('./gSheetApiHandler');

// Create a logger instance for error logging
const logger = log4js.getLogger('messageHandler');

// Message handling logic
async function handleMessage(ctx) {
  try {
    const message = ctx.message.text;
    const chatId = ctx.chat.id;
    const msgSenderFirstName = ctx.message.from.first_name;
    const msgSenderUsername = ctx.message.from.username;
    const msgSenderId = ctx.message.from.id;
    const groupName = ctx.message.chat.title;
    const msgId = ctx.message.message_id;

    // Log info
    logger.info(`Received message: ${message}`);

    // Check if the message contains the keyword and do nothing if none found
    let keyword = await getKeyword();
    if (!message.toLowerCase().includes(keyword.toLowerCase())) {
      return;
    }

    // Check for existing orders and do nothing if exists
    const existingOrders = await findExistingOrders(chatId, msgSenderId);
    if (existingOrders.length > 0) {
      logger.info(`Message received from ${msgSenderFirstName}( ${msgSenderUsername} ). ` +
        `${msgSenderFirstName} has placed an order previously in groupchat ${groupName}. Ignorning order....`);
      return;
    }

    // Process order data from message
    const processedOrders = processOrder(message, keyword, true); // Set flag to false to get full order array; set true for only last line of customer order
    if (!processedOrders || !Array.isArray(processedOrders) || processedOrders.length === 0) {
      logger.warn('No valid orders found in the message:', processedOrders);
      return;
    }
    const orderId = generateOrderID();
    const orderDate = new Date().toLocaleString('en-SG', { 
      timeZone: 'Asia/Singapore', 
      year: '2-digit', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    }).replace(',', '');

    // Store order details into database `orders` table
    await storeOrder(chatId, msgSenderUsername, msgSenderId, groupName, orderId, orderDate, processedOrders);

    // Store order items into database `order_items` table
    await storeOrderItems(orderId, processedOrders);

    // Store message tracking details
    await storeMessageTracking(chatId, groupName, msgId);

    // Add order to Google Sheets
    await addOrderToGoogleSheets(groupName, orderDate, orderId, msgSenderUsername, processedOrders);

    // Reply with thank you message and order ID
    await ctx.reply(`Thank you so much for your support ${msgSenderFirstName} 😁 Your order has been noted down 🙂` +
      `\n\nOrder-ID: ${orderId}`);
  } catch (error) {
    // Log the error
    logger.error(error);
  }
}

// Function to read config.json file and retrieve the keyword value
async function getKeyword() {
  try {
    const configPath = path.join(__dirname, 'config.json');
    const configData = await readFileAsync(configPath, 'utf8');
    const config = JSON.parse(configData);
    return config.keyword || '';
  } catch (error) {
    // Log the error
    logger.error('Error reading config.json:', error);
    throw error; // Re-throw the error to propagate it further
  }
}

// Function to store message tracking details in the message_tracking table
async function storeMessageTracking(chatId, groupName, msgId) {
  try {
    const insertQuery = 'INSERT INTO message_tracking (chat_id, chat_title, msg_id) VALUES (?, ?, ?)';
    await new Promise((resolve, reject) => {
      db.run(insertQuery, [chatId, groupName, msgId], err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    // Log the error
    logger.error('Error storing message tracking:', error);
    throw error; // Re-throw the error to propagate it further
  }
}

module.exports = {
  handleMessage
};