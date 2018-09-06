const QueryRange = require('./query-range');
const Pipeline = require('./pipeline');
const { serial } = require('./util');

const durations = require('./durations');

class Monitor {
  constructor(startDate, callbacks, pipelineSteps=[], interval=1000) {
    if (typeof callbacks.onFetch !== 'function') {
      throw Error('callbacks.onFetch must be a function that returns a Promise');
    }

    this.startDate = startDate;
    this.callbacks = callbacks;
    this.mainQueryRange = new QueryRange('5m', callbacks.onFetch);
    this._interval = interval;
    this.ranges = {};
    this._lastResults = null;

    for (let duration of durations) {
      this.ranges[duration] = {
        queryRange: duration != this.mainQueryRange.interval
          ? new QueryRange(duration, (interval, start, end) => {
              // temp
              return callbacks.onFetch(interval, start, end);
            //return this._aggregateData(this.ranges[duration].queryRange.intervalMs, start, end);
            })
          : this.mainQueryRange,
        pipeline: new Pipeline(pipelineSteps)
      };
    }
  }

  _loop() {
    this._timeout = setTimeout(() => {
      let startDate = (this.mainQueryRange.data.length != 0)
        ? new Date(this.mainQueryRange.data[this.mainQueryRange.data.length - 1].timestamp)
        : new Date(this.startDate);
      let endDate = new Date();

      startDate.setSeconds(0, 0);
      endDate.setSeconds(0, 0);

      console.log('Fetch local ' + startDate.toISOString() + '  --  ' + endDate.toISOString());

      startDate = startDate.valueOf();
      endDate = endDate.valueOf();

      this.mainQueryRange.query(startDate, endDate, true).then((data) => {
        let results = {};
        let aggRanges = [];

        for (let key in this.ranges) {
          if (this.ranges[key] == this.mainQueryRange) {
            results[this.ranges[key].queryRange.interval] = { values: data };
            continue;
          }
  
          aggRanges.push(key);
        }

        // Promise.all causing a strange anomaly where values are written to mainQueryRange's data property in multiple places??
        serial(aggRanges.map(k => () => this.ranges[k].queryRange.query(startDate, endDate, true).then(d => results[k] = { values: d }))).then(() => {
          for (let key in results) {
            //if (key != 'trendlines' || (key == '4h' || key == '1h')) { // temp
            //  console.log('Run pipeline on timeframe ' + key + ' (' + this.ranges[key].queryRange.data.length + ')');
              results[key] = this.ranges[key].pipeline.run({ values: this.ranges[key].queryRange.data });
            //}
          }

          let resultsJson = JSON.stringify(results);

          if (resultsJson != this._lastResults) {
            // can do analyse this data when received -- perform S&R check, trendlines, etc.
            if (typeof this.callbacks.onResults === 'function') {
              this.callbacks.onResults(results);
            }
          }

          this._lastResults = resultsJson;

          clearTimeout(this._timeout);
          this._loop();
        });
      });
    }, this._interval);
  }

  _aggregateData(durationMs, start, end) {
    console.log('check ' + durationMs + ' : (' + start + ', ' + end + ')');
    return this.mainQueryRange.query(start, end).then((results) => {
      // aggregate the results from the main QueryRange. results will be stored in this.ranges[duration] for later use, as well.
      let summedData = [];
      /* @FIXME: this is going to be impossible to calculate volume on if we just keep adding it up
         look into storing an array of each 5m candle and summing it all up
      */

      results.forEach((candle) => {
        if (summedData.length == 0) {
          summedData.push(Object.assign({}, candle));
          return;
        }

        let lastCandle = summedData[summedData.length - 1];

        if (lastCandle.timestamp + durationMs <= candle.timestamp) {
          // new entry
          summedData.push(Object.assign({}, candle));
        } else {
          lastCandle.close = candle.close;
          lastCandle.high = Math.max(lastCandle.high, candle.high);
          lastCandle.low = Math.min(lastCandle.low, candle.low);
          lastCandle.volume += candle.volume;
        }
      });

      let itemsDiv = Math.ceil(results.length / (durationMs / this.mainQueryRange.intervalMs));
      console.assert(summedData.length == itemsDiv, `for duration: ${durationMs} expected ${itemsDiv} items but got ${summedData.length}  (original: ${results.length})`);

      return summedData;
    });

  }

  start() {
    return new Promise((resolve, reject) => {
      this._loop();
      resolve();
    });
  }
}

module.exports = Monitor;