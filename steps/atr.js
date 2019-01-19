const Step = require('../step');

function mean(values) {
  let res = 0;

  values.forEach((v) => res += v);
  res /= values.length;

  return res;
}

const length = 14;

class ATR extends Step {
  constructor(source='close', length=14) {
    super();

    this.source = source;
    this.length = length;
  }

  execute(data) {
    let results = {};

    let trueRange = [];

    for (let i = 0; i < data.length; i++) {
      let current = data[i];

      if (i == 0) {
        //trueRange[current.timestamp] = 0;
        trueRange.push(0);
        continue;
      }

      let prev = data[i - 1];

      //trueRange[current.timestamp] = Math.max(current.high - current.low, Math.max(Math.abs(prev.close - current.high), Math.abs(prev.close - current.low)));
      trueRange.push(Math.max(current.high - current.low, Math.max(Math.abs(current.high - prev.close), Math.abs(current.low - prev.close))));
    }

    const k = 2 / (length + 1);
    let emaArr = [];

    for (let i = 0; i < trueRange.length; i++) {
      if (i == 0) {
        emaArr.push(trueRange[i]);
        continue;
      }

      emaArr.push(trueRange[i] * k + emaArr[emaArr.length - 1] * (1 - k));
    }

    console.assert(emaArr.length == data.length, 'emaArr.length should be equal to data.length');

    let emaObj = {};

    for (let i = 0; i < emaArr.length; i++) {
      emaObj[data[i].timestamp] = emaArr[i];
    }

    return emaObj;
  }
}

ATR.options = {
  configuration: {
    length: {
      default: 14,
      text: 'Length'
    }
  }
};

module.exports = ATR;