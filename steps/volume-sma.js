const Step = require('../step');

const SMA = require('../services/sma');

class VolumeSMA extends Step {
  constructor(length=14) {
    super();

    this.length = length;
  }

  execute(data) {
    let sma = new SMA(this.length),
        volumeAverage = {};

    for (let i = 0; i < data.length; i++) {
      let current = data[i];

      sma.update(current.volume);

      volumeAverage[current.timestamp] = sma.result;
    }

    return volumeAverage;
  }
}

VolumeSMA.options = {
  requires: [],
  configuration: {
    length: {
      default: 14,
      text: 'Length'
    }
  }
};

module.exports = VolumeSMA;
