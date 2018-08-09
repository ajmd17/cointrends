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
  constructor(threshold, detail=20) {
    super({
      requires: ['fractals']
    });

    this.threshold = threshold;
    this.detail = detail;
  }

  filter(data) {
  }

  execute(data, { fractals }) {
    let clusters = [];

    Object.keys(fractals).forEach((key) => {
      let f = fractals[key].map((idx) => data[idx]);
      let pt = key == 'up' ? f.low : f.high;
      
      f.forEach((fractal, i) => {
        let inRange = [];

        Object.keys(fractals).forEach((key2) => {
          for (let j = 0; j < fractals[key2].length; j++) {
            let pt2 = key2 == 'up' ? fractals[key2][j].low : fractals[key2][j].high;

            if (key2 == key && j == i) {
              continue;
            }
  
            if (percentDiff(pt, pt2) <= this.threshold) {
              inRange.push([fractals[key2].timestamp, pt2]);
            }
          }
        });

        if (inRange.length != 0) {
          clusters.push({ avg: (pt + inRange.reduce((accum, el) => accum + el[1], 0)) / (inRange.length + 1), points: [[fractal.timestamp, pt]].concat(inRange) });
        }
      });
    });

    const groups = jenks(clusters.map((el) => el.avg), this.detail);

    return groups;
  }
}

module.exports = SupportResistance;