const Step = require('../step');

class Fractals extends Step {
  constructor() {
    super();
  }

  filter(data) {

  }

  execute(data) {
    console.log('[Fractals] data.length = ' + data.length);
    let results = {
      up: [],
      down: []
    };

    for (let i = 0; i < data.length; i++) {
      if (i < 2 || i > data.length - 3) {
        continue;
      }

      let down = (data[i - 2].high < data[i].high) && (data[i - 1].high < data[i].high) && (data[i + 1].high < data[i].high) && (data[i + 2].high < data[i].high);
      let up = (data[i - 2].low > data[i].low) && (data[i - 1].low > data[i].low) && (data[i + 1].low > data[i].low) && (data[i + 2].low > data[i].low);
  
      let obj = { index: i, timestamp: data[i].timestamp };

      if (down) {
        results.down.push(obj);
      } else if (up) {
        results.up.push(obj);
      }
    }

    return results;
  }
}

module.exports = Fractals;