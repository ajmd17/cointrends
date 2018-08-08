const Step = require('./step');

class Pipeline {
  constructor(steps={}) {
    this.steps = [];
    this.dataStore = {};

    for (let key in steps) {
      this.add(key, steps[key]);
    }
  }

  add(key, step) {
    console.assert(step instanceof Step, 'must be an instance of Step');

    step._opts.requires.forEach((requireKey) => {
      if (this.steps.findIndex(x => x.key == requireKey) === -1) {
        throw Error(`${key} step requires the '${requireKey}'`);
      }
    });

    this.steps.push({ key, step });
  }

  filter(data) {
    data['_filters'] = data['_filters'] || {};

    for (let i = 0; i < this.steps.length; i++) {
      let key = this.steps[i].key;
      let step = this.steps[i].step;
      
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

    return data;
  }

  getDataStore(key) {
    return this.dataStore[key];
  }
}

module.exports = Pipeline;