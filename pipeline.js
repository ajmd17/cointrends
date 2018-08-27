const _ = require('lodash');

const Step = require('./step');

class Pipeline {
  constructor(steps=[]) {
    this.steps = [];
    this.dataStore = {};
    this.lastTimestamp = null;

    for (let step of steps) {
      if (step instanceof Step) {
        let key = _.snakeCase(step.constructor.name);
        this.add(key, step);
      } else {
        console.assert(typeof step === 'function' && step.prototype != null, 'step should be a constructor')
      
        let key = _.snakeCase(step.name);
        let stepObj = new step;

        console.assert(stepObj instanceof Step, 'constructor must inherit from Step');

        this.add(key, stepObj);
      }
    }
  }

  add(key, step) {
    console.assert(step instanceof Step, 'must be an instance of Step');

    step._opts.requires.forEach((requireKey) => {
      if (typeof requireKey === 'function') {
        requireKey = _.snakeCase(requireKey.name);
      }

      if (this.steps.findIndex(x => x.key == requireKey) === -1) {
        throw Error(`${key} step requires the '${requireKey}' step`);
      }
    });

    this.steps.push({ key, step });
  }

  run(data) {
    data['_filters'] = data['_filters'] || {};

    for (let i = 0; i < this.steps.length; i++) {
      let key = this.steps[i].key;
      let step = this.steps[i].step;

      console.log(' - Run filter ' + key);

      if (step.isRealtime || data.values[data.values.length - 1].timestamp != this.lastTimestamp) {
        /* filter the current data using the pipe */
        let filterResult = step.filter(data.values, data._filters);

        /* get new data to be stored for the pipe */
        let pipeData = step.execute(data.values, data._filters);


        if (filterResult) {
          data.values = filterResult;
        }

        if (pipeData) {
          data['_filters'][key] = pipeData;
          this.dataStore[key] = pipeData;
        }
      }
    }

    this.lastTimestamp = data.values[data.values.length - 1].timestamp;

    return data;
  }

  getDataStore(key=undefined) {
    if (typeof key === 'undefined') {
      return this.dataStore;
    }

    return this.dataStore[key];
  }
}

module.exports = Pipeline;