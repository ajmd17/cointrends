const request = require('request');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const startDate = new Date();
startDate.setDate(startDate.getDate() - 1);

const dataStorePath = path.join(__dirname, 'datastore');



if (!fs.existsSync(dataStorePath)) {
  fs.mkdirSync(dataStorePath);
}

for (let key in exchanges) {
  let exchange = exchanges[key];

  if (exchange.symbols) {
    exchange.symbols.forEach((symbol) => {
      exchange.monitors[symbol] = new ExchangeMonitor(key, symbol, startDate);
      exchange.monitors[symbol].start().then(() => {
        const hashKey = crypto.createHash('sha1').update(key).digest('hex');
        const keyPath = path.join(dataStorePath, hashKey);
    
        if (!fs.existsSync(keyPath)) {
          fs.mkdirSync(keyPath);
        } else {
          const filepath = path.join(keyPath, `${symbol}.json`);

          if (fs.existsSync(filepath)) {
            // @TODO: json file exists - preload the data.
          }
        }
    
        exchange.dirpath = keyPath;
      });
    });
  }
}
