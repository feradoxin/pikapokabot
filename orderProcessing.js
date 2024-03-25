const { db } = require('./db/database');
const log4js = require('./log4js.config.js');

// Create a logger instance for error logging
const logger = log4js.getLogger('orderProcessing');

// Function to store order details in the orders table
async function storeOrder(chatId, msgSenderUsername, msgSenderId, groupName, orderId, orderDate, processedOrders) {
  try {
    if (!Array.isArray(processedOrders)) {
      logger.error('Processed orders is not an array:', processedOrders);
      return; // Return early if processedOrders is not an array
    }
    
    const insertQuery = 'INSERT INTO orders (chat_id, chat_title, msg_sender, msg_sender_id, order_id, order_date, customer_name) VALUES (?, ?, ?, ?, ?, ?, ?)';
    let customerName = '';
    if (processedOrders.length > 0 && processedOrders[0].customerName) {
      customerName = processedOrders[0].customerName;
    }
    return new Promise((resolve, reject) => {
      db.run(insertQuery, [chatId, groupName, msgSenderUsername, msgSenderId, orderId, orderDate, customerName], err => {
        if (err) {
          logger.error('Error storing order details:', err);
          reject(err);
        } else {
          logger.debug('Storing order details:', [chatId, groupName, msgSenderUsername, msgSenderId, orderId, orderDate, customerName]);
          resolve();
        }
      });
    });
  } catch (error) {
    logger.error('Error storing order details:', error);
    throw error;
  }
}

// Function to store order items in the order_items table
async function storeOrderItems(orderId, processedOrders) {
  try {
    const insertQuery = 'INSERT INTO order_items (order_id, item_name, item_qty) VALUES (?, ?, ?)';
    for (const order of processedOrders) {
      if (!Array.isArray(order.items)) {
        logger.error('Order items is not an array:', order.items);
        continue; // Skip this order and proceed to the next one
      }
      for (const item of order.items) {
        // Ensure item is defined and has the expected properties
        if (item && typeof item === 'object' && 'item' in item && 'quantity' in item) {
          await new Promise((resolve, reject) => {
            db.run(insertQuery, [orderId, item.item, item.quantity], err => {
              if (err) {
                reject(err);
              } else {
                logger.debug('Storing order items:', [orderId, item.item, item.quantity]);
                resolve();
              }
            });
          });
        } else {
          logger.error('Invalid item format:', item);
        }
      }
    }
  } catch (error) {
    // Log the error
    logger.error('Error storing order items:', error);
    throw error; // Re-throw the error to propagate it further
  }
}

function extractOrderFields(message, keyword) {
  // Initialize an array to store extracted order fields
  const orderFields = [];

  // Split the message into lines
  const lines = message.split('\n');
  let keywordFound = false;

  // Iterate through each line to find the keyword and extract subsequent lines
  for (const line of lines) {
    if (keywordFound && line.trim() !== '') {
      // Check if the line starts with a customer name followed by a colon
      if (/^[a-zA-Z]+\s*:/.test(line.trim())) {
        // Add the line to the array of extracted order fields
        orderFields.push(line.trim());
      } else {
        // If it doesn't start with a customer name, consider it as part of the previous order field
        orderFields[orderFields.length - 1] += '\n' + line.trim();
      }
    } else if (line.toLowerCase().includes(keyword.toLowerCase())) {
      // Set flag to true once keyword is found
      keywordFound = true;
    }
  }

  // Verbose logging for debugging
  logger.debug(`Order Fields Extracted:`, orderFields);

  return orderFields;
}

// Function to process unformatted order information
function processOrder(message, keyword, onlyLast = false) {
  // Get the array of unformatted order fields using extractOrderFields
  const orderFields = extractOrderFields(message, keyword);

  // Initialize an array to store processed orders
  const processedOrders = [];

  // Iterate through each unformatted order field and process it
  for (const orderField of orderFields) {
    // Split the unformatted order by customer and their orders
    const [customerName, orderText] = orderField.split(':');

    // Check if orderText is defined before attempting to split and trim it
    if (orderText) {
      // Extract individual orders from the order text
      const orders = orderText.trim().split(',').map(order => {
        // Split each order to extract item name and quantity
        const lastSpaceIndex = order.lastIndexOf(' ');
        const item = order.slice(0, lastSpaceIndex);
        const quantityText = order.slice(lastSpaceIndex + 1);
        const quantity = parseInt(quantityText) || 1; // Default quantity to 1 if not specified

        // Verbose logging for debugging
        logger.debug(`Processing order: ${item} - Quantity: ${quantity}`);

        return { item: item.trim(), quantity };
      });

      // Add the processed order to the array
      processedOrders.push({ customerName: customerName.trim(), items: orders });
    }
  }

  // Verbose logging for debugging
  logger.debug('Processed order data:', processedOrders);
  logger.info('Order data processed from unformatted chunk. Enabled debug mode to see order data.');

  return onlyLast ? [processedOrders.pop()] : processedOrders;
}

// Function to generate an order ID
function generateOrderID() {
  const currentDate = new Date();
  const singaporeTime = currentDate.toLocaleString('en-SG', { timeZone: 'Asia/Singapore' }).replace(/\u202F/g, ' '); // Replace non-breaking space with regular space
  logger.debug('generateOrderId() gave singaporeTime as: ',singaporeTime);
  const [datePart, timePart] = singaporeTime.split(', '); // Split into date and time parts
  const [day, monthStr, year] = datePart.split('/'); // Extract day, month, and year
  const month = ('0' + (parseInt(monthStr))).slice(-2); // Add leading zero if needed
  const [time, ampm] = timePart.split(' '); // Extract time and AM/PM indicator
  const [hours, minutes, seconds] = time.split(':'); // Extract hours, minutes, and seconds

  // Combine date and random number to form the order ID
  const orderID = `${day}${month}${year.slice(-2)}-${Math.floor(100000 + Math.random() * 900000)}`;

  return orderID;
}

// Function to search for existing orders with the same chatId and msgSenderId
async function findExistingOrders(chatId, msgSenderId) {
  try {
    const query = 'SELECT * FROM orders WHERE chat_id = ? AND msg_sender_id = ?';
    const rows = await new Promise((resolve, reject) => {
      db.all(query, [chatId, msgSenderId], (err, rows) => {
        if (err) {
          logger.info('findExistingOrders did not find any orders', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
    return rows || []; // Return an empty array if rows is falsy
  } catch (error) {
    // Log the error
    logger.error('Error finding existing orders:', error);
    throw error; // Re-throw the error to propagate it further
  }
}

module.exports = {
    generateOrderID,
    findExistingOrders,
    processOrder,
    storeOrder,
    storeOrderItems
};