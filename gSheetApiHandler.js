const { google } = require('googleapis');
const log4js = require('./log4js.config.js');
require('dotenv').config();

// Google Sheets API credentials
const credentials = {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Replace '\n' characters with line breaks
};

// Google Sheets API configuration
const spreadsheetId = process.env.GSHEET_ID; // Get spreadsheet ID from environment variable
const sheets = google.sheets({ version: 'v4', auth: new google.auth.JWT(credentials.client_email, null, credentials.private_key, ['https://www.googleapis.com/auth/spreadsheets']) });

// Create a logger instance for error logging
const logger = log4js.getLogger('gSheetApiHandler');

// Function to add order to Google Sheets
async function addOrderToGoogleSheets(groupName, orderDate, orderId, msgSenderUsername, processedOrders) {
  try {
      // Determine sheet name based on groupName
      const sheetName = groupName || 'Uncategorised';

      // Check if the sheet exists, if not, create a new one
      const sheetExists = await checkSheetExists(sheetName);
      if (!sheetExists) {
        logger.info(`Sheet '${sheetName}' does not exist. Creating....`);
        await createSheet(sheetName);
      }

      // Identify the range to update
      const range = `${sheetName}!A1`;

      // Prepare the row data
      const rowData = [orderDate, orderId, msgSenderUsername];
      processedOrders.forEach(order => {
          rowData.push(order.customerName); // Add customerName first
          order.items.forEach(item => {
              rowData.push(item.item, item.quantity); // Add item name and quantity
          });
      });

      // Update the spreadsheet with the row data
      await sheets.spreadsheets.values.append({
          spreadsheetId: spreadsheetId,
          range: range,
          valueInputOption: 'USER_ENTERED',
          resource: { values: [rowData] }
      });

      logger.info('Order added to Google Sheets successfully.');
  } catch (error) {
      logger.error('Error adding order to Google Sheets:', error);
      throw error;
  }
}

// Function to check if a sheet exists in the spreadsheet
async function checkSheetExists(sheetName) {
  try {
      const response = await sheets.spreadsheets.get({
          spreadsheetId: spreadsheetId,
          ranges: sheetName,
      });
      logger.info(`Checking if sheet '${sheetName}' exists....`);
      return response.status === 200;
  } catch (error) {
      return false;
  }
}

// Function to create a new sheet in the spreadsheet
async function createSheet(sheetName) {
  try {
      await sheets.spreadsheets.batchUpdate({
          spreadsheetId: spreadsheetId,
          resource: {
              requests: [
                  {
                      addSheet: {
                          properties: {
                              title: sheetName,
                          },
                      },
                  },
              ],
          },
      });
      logger.info(`New sheet '${sheetName}' created successfully.`);
  } catch (error) {
      logger.error(`Error creating sheet '${sheetName}':`, error);
      throw error;
  }
}

module.exports ={
    addOrderToGoogleSheets
}