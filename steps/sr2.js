const Step = require('../step');

const jenks = require('../services/jenks');

function percentDiff(a, b) {
  if (a > b) {
    return Math.abs(1 - b / a);
  } else {
    return Math.abs(1 - a / b);
  }
}

const maxClosesOutside = 2;
const threshold = 0.003; // @TODO swap out for ATR to detect points being close enough
const minRequiredPoints = 2;

class SupportResistance2 extends Step {
  constructor() {
    super();
  }

  execute(data, { swing_points }) {
    let highs = swing_points.filter((swing) => swing.class[1] == 'H');
    let lows = swing_points.filter((swing) => swing.class[1] == 'L');

    let lines = [];

    [highs, lows].forEach((points) => {
      let includedPoints = [];

      for (let i = 0; i < points.length; i++) {
        let point1 = points[i];
        let data1 = data[point1.i1];
        let value1 = data1[point1.class[1] == 'H' ? 'high' : 'low'];

        let numClosesOutside = 0;

        let line = [{ index: i, data: data1, value: value1 }];

        for (let j = i + 1; j < points.length; j++) {
          if (includedPoints.indexOf(j) !== -1) {
            break;//continue;
          }
          
          let point2 = points[j];
          let data2 = data[point2.i1];
          let value2 = data2[point2.class[1] == 'H' ? 'high' : 'low'];
  
          if (percentDiff(value1, value2) <= threshold) {
            numClosesOutside = 0;
            line.push({ index: j, data: data2, value: value2 });
          } else {

            if (point2.class[1] == 'H') {
              if (data2.close > value1) {
                numClosesOutside++;
              }
            } else if (point2.class[1] == 'L') {
              
              if (data2.close < value1) {
                numClosesOutside++;
              }
            }

            if (numClosesOutside >= maxClosesOutside) {
              break;
            }
          }
        }

        if (line.length > minRequiredPoints) {
          line.forEach((pt) => {
            includedPoints.push(pt.index);
            delete pt.index;
          });

          lines.push(line);
        }
      }
    });

    return lines;
  }
}

SupportResistance2.options = {
  requires: ['swing_points'],
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

module.exports = SupportResistance2;