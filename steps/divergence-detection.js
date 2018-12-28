const Step = require('../step');

class DivergenceDetection extends Step {
  constructor() {
    super();
  }

  execute(data, { swing_points, rsi }) {
    let points = [];

    let highs = swing_points.filter((p) => p.class.endsWith('H'));
    let lows = swing_points.filter((p) => p.class.endsWith('L'));

    [highs, lows].forEach((swingPoints) => {
      for (let i = 0; i < swingPoints.length; i++) {
        if (i == 0) continue;

        let point = swingPoints[i];
        let swing = point.class.endsWith('H') ? 'high' : 'low';
        let key = 'close';//swing;

        let obj1 = data[point.i1];
        let rsi1 = rsi[point.t1];

        if (isNaN(rsi1)) {
          continue;
        }

        let tempPoints = [];

        for (let j = i - 1; j >= 0 && j >= (i - 1 - 5); j--) {
          let point2 = swingPoints[j];
          let obj2 = data[point2.i1];
          let rsi2 = rsi[obj2.timestamp];

          if (isNaN(rsi2)) {
            continue;
          }

          let divClass = null;
          let priceChange = (obj1[key] / obj2[key]) - 1;

          let rsiChange = rsi1 / rsi2 - 1;

          let correlation = priceChange / rsiChange;

          if (swing == 'high') {
            if (obj1[key] > obj2[key]) {
              if (rsi1 < rsi2) {
                divClass = 'BR';
              }
            } else if (obj1[key] < obj2[key]) {
              if (rsi1 > rsi2) {
                divClass = 'HBR';
              }
            } else {
              if (rsi1 < rsi2) {
                divClass = 'BR';
              } else if (rsi1 > rsi2) {
                divClass = 'HBR';
              }
            }
          } else if (swing == 'low') {
            if (obj1[key] > obj2[key]) {
              if (rsi1 < rsi2) {
                divClass = 'HBL';
              }
            } else if (obj1[key] < obj2[key]) {
              if (rsi1 > rsi2) {
                divClass = 'BL';
              }
            } else {
              if (rsi1 > rsi2) {
                divClass = 'BL';
              } else if (rsi1 < rsi2) {
                divClass = 'HBL';
              }
            }
          }

          if (divClass != null) {
            console.assert(correlation <= 0, "correlation should be <= 0 for div " + divClass + " but was " + correlation + "   " + JSON.stringify({ priceChange, rsiChange }));
            let divObj = {
              i1: point.i1,
              i2: point2.i1,
              t1: point.t1,
              t2: point2.t1,
              p1i: i,
              p2i: j,
              correlation,
              class: divClass
            };

            tempPoints.push(divObj);
          }
        }
        /** @TODO eliminate "in-betweeners" */
        tempPoints = tempPoints.filter((div, index) => {
          let point1 = swingPoints[div.p1i];
          let point2 = swingPoints[div.p2i];
          let obj1 = data[point1.i1];
          let obj2 = data[point2.i1];

          for (let pi = div.p2i + 1; pi < div.p1i - 1; pi++) {
            let point = swingPoints[pi];
            let obj3 = data[point.i1];

            if (swing == 'high') {
              if (obj3[key] > obj2[key]) {
                return false;
              }
            } else if (swing == 'low') {
              if (obj3[key] < obj2[key]) {
                return false;
              }
            }
          }

          return true;
        });

        tempPoints.sort((a, b) => b.correlation - a.correlation);
        // pick one with least correlation.
        if (tempPoints.length > 0) {
          points.push(tempPoints[tempPoints.length - 1]);
        }
      }
    });

    let all = [];
    let groupedByOrigin = {};

    for (let i = 0; i < points.length; i++) {
      let point = points[i];

      // find all with same origin, pick one with best correlation.
      if (groupedByOrigin[point.t2] == null) {
        groupedByOrigin[point.t2] = [];
      }

      groupedByOrigin[point.t2].push(point);
    }

    Object.keys(groupedByOrigin).forEach((key) => {
      groupedByOrigin[key].sort((a, b) => b.correlation - a.correlation);
      all.push(groupedByOrigin[key][groupedByOrigin[key].length - 1]);
    });

    return all;
  }
}

DivergenceDetection.options = {
  requires: ['rsi', 'swing_points'],
  configuration: {
    lookback: {
      default: 5,
      text: 'Lookback'
    }
  }
};

module.exports = DivergenceDetection;