const Step = require('../step');

function mean(values) {
  let res = 0;

  values.forEach((v) => res += v);
  res /= values.length;

  return res;
}

class RSI extends Step {
  constructor(source='close', length=14) {
    super();

    this.source = source;
    this.length = length;
  }

  execute(data) {
    let results = {};

    let deltas = [];

    for (let i = 0; i < data.length; i++) {
      if (i > 0) {
        deltas.push(data[i][this.source] - data[i - 1][this.source]);
      }
    }

    const delta = (index) => deltas[index - 1];
    const gain = (index) => Math.max(0, delta(index));
    const loss = (index) => Math.abs(Math.min(0, delta(index)));

    let prevAvgGain = NaN;
    let prevAvgLoss = NaN;

    for (let i = 0; i < data.length; i++) {
      if (i > this.length - 1) {
        let period = data.slice(i - this.length + 1, i + 1);

        let avgGain;
        let avgLoss;

        console.assert(period.length == this.length, 'period length should be equal to this.length');

        if (!isNaN(prevAvgGain)) {
          avgGain = (prevAvgGain * (this.length - 1) + gain(i)) / this.length;
        } else {
          avgGain = mean(period.map((p, idx) => gain(i - this.length + 1 + idx)));
        }

        if (!isNaN(prevAvgLoss)) {
          avgLoss = (prevAvgLoss * (this.length - 1) + loss(i)) / this.length;
        } else {
          avgLoss = mean(period.map((p, idx) => loss(i - this.length + 1 + idx)));
        }

        let rs = avgGain / avgLoss;
        let rsi = 100 - (100 / (1 + rs));

        prevAvgGain = avgGain;
        prevAvgLoss = avgLoss;

        results[data[i].timestamp] = rsi;
      } else {
        results[data[i].timestamp] = NaN;
      }
    }

    return results;
  }
}

RSI.options = {
  configuration: {
    source: {
      default: 'close',
      allowed: ['open', 'close', 'high', 'low']
    },
    length: {
      default: 14
    }
  },
  alerts: {
    alertOnOverbought: {
      text: 'Alert on overbought'
    }
  }
};

module.exports = RSI;