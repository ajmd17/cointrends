const Step = require('../step');

class RSI extends Step {
  constructor() {
    super();

    this.length = 14;
  }

  filter(data) {

  }

  execute(data) {
    let results = [];

    for (let i = 0; i < this.length; i++) {
      let rsiObj = { timestamp: NaN, rsi: NaN };

      let dataIndex = data.length - this.length + 1;
      if (dataIndex >= 0) {
        rsiObj.timestamp = data[dataIndex].timestamp;
        /** @TODO calculate RSI and set the 'rsi' value */
      }
      
      results.push(rsiObj);
    }

    return results;
  }
}

module.exports = RSI;