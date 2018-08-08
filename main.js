const request = require('request');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const Monitor = require('./monitor');

const startDate = new Date();
startDate.setDate(startDate.getDate() - 1);

const dataStorePath = path.join(__dirname, 'datastore');

const exchanges = {
  'binance': {
    symbols: ['BTCUSDT'], /* @TODO: a way to load symbols programmatically */
    monitors: {},
    url: ({ symbol, interval, start, end }) => `https://api.binance.com/api/v1/klines?symbol=${symbol}&interval=${interval}&startTime=${start}&endTime=${end}`,
    transform(obj) {
      const [
        openTime,
        open,
        high,
        low,
        close,
        volume,
        closeTime
      ] = obj;

      return {
        date: new Date(openTime),
        timestamp: new Date(openTime).valueOf(),
        open: +open,
        high: +high,
        low: +low,
        close: +close,
        volume: +volume
      };
    }
  }
};

class ExchangeMonitor extends Monitor {
  constructor(exchange, symbol, startDate) {
    super(startDate, {
      onFetch: (start, end) => {
        console.assert(exchanges[this.exchange] != null, `exchange ${this.exchange} not found`);
        const { url, transform } = exchanges[this.exchange];
        let urlString = url({ symbol: this.symbol, interval: this.interval, start, end });
    
        let duration = ((new Date(end).valueOf() - new Date(start).valueOf()) / 60000).toFixed(2);
        console.log('Fetch remote - ' + duration + 'm range');
    
        return new Promise((resolve, reject) => {
          request.get(urlString, (err, resp) => {
            if (err) {
              reject(err);
            } else {
              try {
                let data = JSON.parse(resp.body);
    
                if (!Array.isArray(data) || data.length == 0) {
                  resolve([]);
                  return;
                }
    
                let invalidIndex = -1;
    
                for (let i = 0; i < data.length; i++) {
                  if (!Array.isArray(data[i])) {
                    invalidIndex = i;
                    break;
                  }
                }
    
                if (invalidIndex !== -1) {
                  data.splice(invalidIndex);
                }
    
                data = data.filter(x => Boolean(x));
    
                if (data.length == 0) {
                  resolve([]);
                  return;
                }
    
                resolve(data.map(obj => transform(obj)));
              } catch (err) {
                reject(err);
              }
            }
          });
        });
      },
      onResults: (results) => {
        // @TODO: delay writing to maybe once every ~5 minutes to prevent too much disk usage
        if (exchanges[this.exchange].dirpath) {
          const filepath = path.join(exchanges[this.exchange].dirpath, `${this.symbol}.json`);

          // write new line. each line is a record
          /*fs.appendFile(filepath, JSON.stringify(results) + '\n', (err) => {
            if (err) {
              console.error(`Failed to write file ${filepath}`, err);
            }
          });*/

          let allResults = {};

          for (let key in this.ranges) {
            allResults[key] = this.ranges[key].data;
          }

          fs.writeFile(filepath, JSON.stringify(allResults, null, '\t'), (err) => {
            if (err) {
              console.error(`Failed to write file ${filepath}`, err);
            }
          });
        }
      }
    });

    this.exchange = exchange;
    this.symbol = symbol;
  }
}


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
