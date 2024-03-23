const log4js = require('log4js');

log4js.configure({
  appenders: {
    file: { type: 'file', filename: './logs/logs.log' },
    console: { type: 'console' }
  },
  categories: {
    default: { appenders: ['file', 'console'], level: 'info' },
    commandHandler: { appenders: ['file', 'console'], level: 'info' },
    gSheetApiHandler: { appenders: ['file', 'console'], level: 'info' },
    messageHandler: { appenders: ['file', 'console'], level: 'info' },
    index: { appenders: ['file', 'console'], level: 'info' },
    orderProcessing: { appenders: ['file', 'console'], level: 'info' },
    database: { appenders: ['file', 'console'], level: 'info' }
  }
});

module.exports = log4js;