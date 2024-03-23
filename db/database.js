const sqlite3 = require('sqlite3').verbose();
const log4js = require('../log4js.config.js');

// Get logger instance
const logger = log4js.getLogger('database');

// Set up SQLite database connection
const db = new sqlite3.Database('./db/database.db', err => {
  if (err) {
    logger.error('Error opening database connection:', err.message);
  } else {
    logger.info('Connected to the database.');
    // Check if tables exist, if not create them
    db.run(`CREATE TABLE IF NOT EXISTS message_tracking (
      chat_id TEXT,
      chat_title TEXT,
      msg_id TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      order_id TEXT,
      order_date TEXT,
      chat_id TEXT,
      chat_title TEXT,
      msg_sender TEXT,
      msg_sender_id TEXT,
      customer_name TEXT,
      FOREIGN KEY(chat_title) REFERENCES message_tracking(chat_title)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY,
      order_id TEXT,
      item_name TEXT,
      item_qty TEXT,
      FOREIGN KEY(order_id) REFERENCES orders(order_id)
    )`);
  }
});

// Export database functions
module.exports = {
  db
};
