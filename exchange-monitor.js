const request = require('request');
const path = require('path');
const fs = require('fs');

const Monitor = require('./monitor');
const Pipeline = require('./pipeline');
const { Fractals, SupportResistance } = require('./steps');

const exchanges = require('./exchanges');

class ExchangeMonitor extends Monitor {
  constructor(exchange, symbol, startDate) {
    super(startDate, {
      onFetch: (start, end) => {
        console.assert(exchanges[this.exchange] != null, `exchange ${this.exchange} not found`);
        const { url, transform } = exchanges[this.exchange];
        let urlString = url({ symbol: this.symbol, interval: this.mainQueryRange.interval, start, end });
    
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

          // let allResults = {};

          // for (let key in this.ranges) {
          //   allResults[key] = this.ranges[key].data;
          // }

          fs.writeFile(filepath, JSON.stringify(results, null, '\t'), (err) => {
            if (err) {
              console.error(`Failed to write file ${filepath}`, err);
            }
          });
        }
      }
    }, [Fractals, SupportResistance]);

    this.exchange = exchange;
    this.symbol = symbol;
  }
}

module.exports = ExchangeMonitor;