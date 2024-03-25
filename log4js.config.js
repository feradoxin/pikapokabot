const log4js = require('log4js');

log4js.configure({
  appenders: {
    file: { type: 'file', filename: './logs/logs.log' },
    console: { type: 'console' }
  },
  categories: {
    default: { appenders: ['file', 'console'], level: 'debug' },
    commandHandler: { appenders: ['file', 'console'], level: 'debug' },
    gSheetApiHandler: { appenders: ['file', 'console'], level: 'debug' },
    messageHandler: { appenders: ['file', 'console'], level: 'debug' },
    index: { appenders: ['file', 'console'], level: 'debug' },
    orderProcessing: { appenders: ['file', 'console'], level: 'debug' },
    database: { appenders: ['file', 'console'], level: 'debug' }
  }
});

module.exports = log4js;