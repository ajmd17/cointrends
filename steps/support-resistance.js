const Step = require('../step');

const jenks = require('../services/jenks');

function percentDiff(a, b) {
  if (a > b) {
    return Math.abs(1 - b / a);
  } else {
    return Math.abs(1 - a / b);
  }
}

class SupportResistance extends Step {
  constructor(threshold=0.01, detail=20) {
    super();

    this.threshold = threshold;
    this.detail = detail;
  }

  execute(data, { fractals, atr }) {
    let clusters = [];

    Object.keys(fractals).forEach((key) => {
      let f = fractals[key].map(({ index }) => data[index]);
      
      f.forEach((fractal, i) => {
        let inRange = [];
        let pt = key == 'up' ? fractal.low : fractal.high;

        Object.keys(fractals).forEach((key2) => {
          for (let j = 0; j < fractals[key2].length; j++) {
            let fractal2 = data[fractals[key2][j].index];
            let pt2 = key2 == 'up' ? fractal2.low : fractal2.high;

            if (key2 == key && j == i) {
              continue;
            }
  
            if (Math.abs(pt - pt2) <= (atr[fractal.timestamp] + atr[fractal2.timestamp]) / 2) {
              inRange.push([fractal2.timestamp, pt2]);
            }
          }
        });

        if (inRange.length != 0) {
          let avg = (inRange.reduce((accum, el) => accum + el[1], pt)) / (inRange.length + 1);
          let foundIndex = clusters.findIndex((c) => c.avg == avg);

          if (foundIndex == -1) {
            clusters.push({ avg, points: [[fractal.timestamp, pt]].concat(inRange) });
          }
        }
      });
    });

    let clusterAvgs = clusters.map(x => x.avg);
    let groups = jenks(clusterAvgs, Math.min(clusterAvgs.length, this.detail)).filter(x => x != null);

    return groups;
  }
}

SupportResistance.options = {
  requires: ['fractals', 'atr'],
  configuration: {
    threshold: {
      default: 0.01,
      min: 0.005,
      max: 0.1,
      text: 'Threshold'
    },
    detail: {
      default: 10,
      min: 5,
      max: 50,
      text: 'Detail'
    }
  }
};

module.exports = SupportResistance;