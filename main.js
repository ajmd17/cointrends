const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const startDate = new Date();
startDate.setDate(1);

const exchanges = require('./exchanges');
const durations = require('./durations');
const ExchangeMonitor = require('./exchange-monitor');

const dataStorePath = path.join(__dirname, 'datastore');

if (!fs.existsSync(dataStorePath)) {
  fs.mkdirSync(dataStorePath);
}

const Api = require('./api');

Api.startServer().then(() => {
  for (let key in exchanges) {
    let exchange = exchanges[key];
  
    if (exchange.symbols) {
      exchange.symbols.forEach((symbol) => {
        exchange.monitors[symbol] = new ExchangeMonitor(key, symbol, startDate);
        
        const preloadData = () => {
          const hashKey = crypto.createHash('sha1').update(key).digest('hex');
          const keyPath = path.join(dataStorePath, hashKey);
      
          if (!fs.existsSync(keyPath)) {
            fs.mkdirSync(keyPath);
          } else {
            const filepath = path.join(keyPath, `${symbol}.json`);
  
            if (fs.existsSync(filepath)) {
              // @TODO: json file exists - preload the data.
              console.log('Preload ' + filepath);
              let content = fs.readFileSync(filepath);

              try {
                let json = JSON.parse(content);

                Object.keys(json).forEach((tf) => {
                  console.assert(durations.indexOf(tf) !== -1, 'key should be a duration but got ' + tf);

                  console.assert(json[tf].values instanceof Array, `json[${tf}].values should be an Array`);
                  exchange.monitors[symbol].ranges[tf].queryRange.data = json[tf].values;
                });
    
                console.log('Preloaded ' + filepath);
              } catch (err) {
                console.error(`Failed to load JSON file '${filepath}': `, err);
              }
            }
          }
      
          exchange.dirpath = keyPath;
        };
        
        preloadData();
        exchange.monitors[symbol].start().then(() => {
          
        });
      });
    }
  }
});