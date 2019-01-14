const QueryRange = require('./query-range');
const Pipeline = require('./pipeline');
const { serial } = require('./util');

const durations = require('./durations');
const config = require('./config');

class Monitor {
  constructor(startDate, callbacks, pipelineSteps=[], interval=10000) {
    if (typeof callbacks.onFetch !== 'function') {
      throw Error('callbacks.onFetch must be a function that returns a Promise');
    }

    this.startDate = startDate;
    this.callbacks = callbacks;
    this.mainQueryRange = new QueryRange(durations[0], callbacks.onFetch);
    this._interval = interval;
    this.ranges = {};
    this._lastTimestamps = {}; // used for determining candle open
    this._lastResults = null;

    for (let duration of durations) {
      this.ranges[duration] = {
        queryRange: duration != this.mainQueryRange.interval
          ? new QueryRange(duration, (interval, start, end) => {
              // temp
              return callbacks.onFetch(interval, start, end).catch((err) => {
                console.error('onFetch callback failed: ', err);
                return null;
              });
            //return this._aggregateData(this.ranges[duration].queryRange.intervalMs, start, end);
            })
          : this.mainQueryRange,
        pipeline: new Pipeline(pipelineSteps),
        customPipelines: {} // per-user, custom configured. will go inactive over time
      };
    }
  }

  runPipelines(tf, data) {
    return new Promise((resolve, reject) => {
      let obj = {
        values: data
      };

      let resultData = this.ranges[tf].pipeline.run(obj);

      let customPromises = [];

      for (let id in this.ranges[tf].customPipelines) {
        console.log('Run custom pipeline ' + id);

        let { expiry, pipeline } = this.ranges[tf].customPipelines[id];

        customPromises.push(() => {
          let res = pipeline.run(obj); /** @TODO make async? */
          // stash the data away
          this.ranges[tf].customPipelines[id].data = res;
          return Promise.resolve(res);
        });

        if (Date.now() >= expiry) {
          /** @TODO send expiry notification. in future */
          delete this.ranges[tf].customPipelines[id];
        }
      }

      return Promise.all(customPromises).then(() => resolve(resultData));
    });
  }

  _loop() {
    this._timeout = setTimeout(() => {
      let startDate = (this.mainQueryRange.data.length != 0)
        ? new Date(this.mainQueryRange.data[this.mainQueryRange.data.length - 1].timestamp)
        : new Date(this.startDate);
      let endDate = new Date();

      startDate.setSeconds(0, 0);
      endDate.setSeconds(0, 0);

      startDate = startDate.valueOf();
      endDate = endDate.valueOf();

      this.mainQueryRange.query(startDate, endDate, true).then((data) => {
        let results = {
          [this.mainQueryRange.interval]: { values: data }
        };

        let aggRanges = [];
        for (let key in this.ranges) {
          if (this.ranges[key] != this.mainQueryRange) {
            aggRanges.push(key);
          }
        }

        const next = (results) => {
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
        };

        // Promise.all causing a strange anomaly where values are written to mainQueryRange's data property in multiple places??
        serial(aggRanges.map(k => () => this.ranges[k].queryRange.query(startDate, endDate, true).then(d => results[k] = { values: d }))).then(() => {
          for (let key in results) {
            let data = this.ranges[key].queryRange.data;
            let lastTimestamp = this.ranges[key].queryRange.lastTimestamp;

            let candleOpen = this._lastTimestamps[key] != lastTimestamp;
            if (candleOpen && this._lastTimestamps[key] != undefined) {
              //console.log('[' + key + '] CANDLE OPEN (' + this._lastTimestamps[key] + ' != ' + lastTimestamp + ')');
            }

            this._lastTimestamps[key] = lastTimestamp;

            let values = data;

            if (config.RUN_PIPELINE_ON_CLOSE_ONLY) {
              if (candleOpen) {
                // console.log('Run pipeline on timeframe ' + key + ' (' + data.length + ')');
                values = data.slice(0, data.length - 1);

                this.runPipelines(key, values).then((resultData) => {
                  results[key] = resultData;
                }).then(next);
              } else {
                next(results);
              }
            } else {
              // console.log('Run pipeline on timeframe ' + key + ' (' + data.length + ')');

              this.runPipelines(key, values).then((resultData) => {
                results[key] = resultData;
              }).then(next);
            }


            if (candleOpen && typeof this.callbacks.onCandleOpen === 'function') {
              this.callbacks.onCandleOpen();
            }
          }

          
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