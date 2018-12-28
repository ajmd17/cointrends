const Step = require('../step');

class Volume extends Step {
  constructor() {
    super();
  }

  execute(data) {
    let results = {};

    for (let i = 0; i < data.length; i++) {
      results[data[i].timestamp] = data[i].volume;
    }

    return results;
  }
}

module.exports = Volume;