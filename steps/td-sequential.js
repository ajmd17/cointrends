const Step = require('../step');
const tdSequential = require('tdsequential');

class TDSequential extends Step {
  constructor() {
    super({
      requires: []
    });
  }

  filter(data) {
  }

  execute(data) {

    let objs = [];

    const sellCountdown = (i) => {
      if (i < 4) return 0;
      if (data[i].close > data[i - 4].close) {
        return sellCountdown(i - 1) + 1;
      } else {
        return 0;
      }
    };

    const buyCountdown = (i) => {
      if (i < 4) return 0;
      if (data[i].close < data[i - 4].close) {
        return buyCountdown(i - 1) + 1;
      } else {
        return 0;
      }
    };

    for (let i = 0; i < data.length; i++) {
      objs.push({ timestamp: data[i].timestamp, sellCountdown: sellCountdown(i), buyCountdown: buyCountdown(i) });
    }


    return objs;
    return tdSequential(data).map((obj, i) => Object.assign(obj, { timestamp: data[i].timestamp }));

    let bullishFlip = false;
    let bearishFlip = false;
    let buySetup = false;
    let sellSetup = false;

    let buyCounter = 0;
    let sellCounter = 0;

    for (let i = 0; i < data.length; i++) {
      if (i < 5) {
        continue;
      }

      if (buyCounter == 0 && data[i].close < data[i - 4].close && data[i - 1] > data[i - 5].close) {
        bearishFlip = true;
        bullishFlip = false;
      } else if (sellCounter == 0 && data[i].close > data[i - 4].close && data[i - 1].close < data[i - 5].close) {
        bullishFlip = true;
        bearishFlip = false;
      }

      if (bearishFlip && data[i].close < data[i - 4].close) {
        buyCounter++;
      } else {
        // cancel setup
        buyCounter = 0;
        sellCounter = 0;
      }

      if (buyCounter == 9) {
        buySetup = true;
        sellSetup = false;
        buyCounter = 0;
        objs.push({ timestamp: data[i].timestamp, buySetup, sellSetup });
      }

      if (bullishFlip && data[i].close > data[i - 4].close) {
        sellCounter++;
      } else {
        // cancel setup
        buyCounter = 0;
        sellCounter = 0;
      }

      if (sellCounter == 9) {
        sellSetup = true;
        buySetup = false;
        sellCounter = 0;
        objs.push({ timestamp: data[i].timestamp, buySetup, sellSetup });
      }

    }

    return objs;

  }
}

module.exports = TDSequential;