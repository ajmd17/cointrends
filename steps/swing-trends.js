const Step = require('../step');
const regression = require('regression');

function percentDiff(a, b) {
  if (a > b) {
    return Math.abs(1 - b / a);
  } else {
    return Math.abs(1 - a / b);
  }
}

const magic = 1000000;

class SwingTrends extends Step {
  constructor() {
    super();
  }

  

  _getIntersections(trendlines, pt, index) {
    let intersections = [];
    for (let i = 0; i < trendlines.length; i++) {
      if (i == index) continue;

      if (trendlines[i].point2.t1 >= pt.point1.t1 && trendlines[i].point1.t1 <= pt.point2.t1) {
        intersections.push(i);
      }
    }
    return intersections;
  }

  _pruneTrendlines(trendlines, data) {
    let toDelete = [];

    for (let i = 0; i < trendlines.length; i++) {
      let pt = trendlines[i];
      if (toDelete.indexOf(i) !== -1) {
        continue;
      }

      let intersections = this._getIntersections(trendlines, pt, i);

      for (let j = 0; j < intersections.length; j++) {
        let ipt = trendlines[intersections[j]];
        if (ipt.class == pt.class) {
          let key = ipt.class[1] == 'H'
            ? 'high'
            : 'low';

          if (ipt.class[0] == 'H') { // higher lows/higher highs
            if (data[ipt.point2.i1][key] < data[pt.point2.i1][key]) {
              toDelete.push(intersections[j]);
            } else if (data[ipt.point2.i1][key] == data[pt.point2.i1][key]) {
              if (data[ipt.point1.i1][key] > data[pt.point1.i1][key]) {
                toDelete.push(intersections[j]);
              } else {
                toDelete.push(i);
              }

            } else if (data[ipt.point2.i1][key] > data[pt.point2.i1][key]) {
              toDelete.push(i);
            }
          } else if (ipt.class[0] == 'L') {
            if (data[ipt.point2.i1][key] > data[pt.point2.i1][key]) {
              toDelete.push(intersections[j]);
            } else if (data[ipt.point2.i1][key] == data[pt.point2.i1][key]) {
              if (data[ipt.point1.i1][key] < data[pt.point1.i1][key]) {
                toDelete.push(intersections[j]);
              } else {
                toDelete.push(i);
              }

            } else if (data[ipt.point2.i1][key] < data[pt.point2.i1][key]) {
              toDelete.push(i);
            }
          }

        }
      }
    }

    return trendlines.filter((pt, index) => toDelete.indexOf(index) === -1);
  }

  _detectPatterns(trendlines, data) {
    let patterns = [];

    for (let i = 0; i < trendlines.length; i++) {
      let pt = trendlines[i];

      if (pt.class[1] != 'L') {
        continue;
      }

      let intersections = this._getIntersections(trendlines, pt, i);

      // find intersections that are on the opposite side of the candles
      for (let j = 0; j < intersections.length; j++) {
        let ipt = trendlines[intersections[j]];

        if (ipt.class[1] != 'H') {
          continue; // next. for lows, we are looking for highs
        }

        let patternClass = null;

        if (pt.class == 'HL') {
          if (ipt.class == 'LH') {
            if (ipt.angle < pt.angle) {
              //patternClass = 'SymTri';
            }
          } else if (ipt.class == 'HH') {
            if (pt.angle > ipt.angle) {
              patternClass = 'RisingWedge';
            } else {
              patternClass = 'Channel';
            }
          }
        } else if (pt.class == 'LL') {
          if (ipt.class == 'LH') {

            if (pt.angle > ipt.angle) {
              patternClass = 'FallingWedge';
            } else {
              patternClass = 'Channel'; // dbw?
            }
          } else if (ipt.class == 'HH') {
            patternClass = 'DescendingBroadeningWedge'; /** @TODO broadening wedge detection */
          }
        }

        if (patternClass != null) {
          patterns.push({
            point1: i,
            point2: j,
            class: patternClass
          });
        }
      }
    }

    return patterns;
  }

  execute(data, { swing_points }) {
    let trendlines = [];

    for (let i = 0; i < swing_points.length; i++) {
      let point = swing_points[i];

      let trend = [];

      let skipCounter = 0;

      for (let j = i + 1; j < swing_points.length; j++) {
        let point2 = swing_points[j];

        if (trend.length == 0) {
          if (point2.class[1] == point.class[1]) {
            trend.push(point2);
          }
        } else {
          if (point2.class[1] == point.class[1]) {//point2.class == trend[0].class) {
            trend.push(point2);
            if (trend.length == 3) {
              break;
            }
          }
        }
      }

      trend = [point].concat(trend);

      if (trend.length >= 2) {
        /** @TODO calculate a regression of all the points in the trend,
         * and calculate the mean deviation from point to prediction.
         * we will use this deviation to determine whether or not to keep the trend
         */
        let regrData = [];
        for (let i = 0; i < trend.length; i++) {
          let t = trend[i];
          regrData.push([t.t1 / magic, t.class.endsWith('L') ? data[t.i1].low : data[t.i1].high]);
        }
        let regr = regression.linear(regrData);

        let scoreSum = 0;

        for (let i = 0; i < trend.length; i++) {
          let key = trend[i].class.endsWith('L') ? 'low' : 'high';
          let score = percentDiff(data[trend[i].i1][key], regr.predict(trend[i].t1 / magic)[1]);
          // console.log('score[' + i + '] = ', score);
          scoreSum += score;
          trend[i] = {
            point: trend[i],
            score
          };
        }

        let meanScore = scoreSum / trend.length;
        let key = trend[0].point.class[1] == 'L' ? 'low' : 'high';
        let direction = (data[trend[0].point.i1][key] > data[trend[trend.length - 1].point.i1][key])
          ? 'L'
          : 'H';
        let trendClass = direction + trend[0].point.class[1];

        trendlines.push({
          point1: trend[0].point,
          point2: trend[trend.length - 1].point,
          angle: Math.atan2(data[trend[trend.length - 1].point.i1][key] - data[trend[0].point.i1][key], (data[trend[trend.length - 1].point.i1].timestamp - data[trend[0].point.i1].timestamp) / magic),
          meanScore,
          class: trendClass
        });
      }
    }

    let meanMeanScore = 0;

    for (let i = 0; i < trendlines.length; i++) {
      meanMeanScore += trendlines[i].meanScore;
    }

    meanMeanScore /= trendlines.length;

    const requiredAccuracy = 1;//0.1;

    
    // trendlines = trendlines.filter((pt) => {
    //   return pt.meanScore <= (meanMeanScore * (requiredAccuracy));
    // });

    //trendlines = this._pruneTrendlines(trendlines, data);
    let patterns = this._detectPatterns(trendlines, data);

    return {
      trendlines,
      patterns
    };
  }
}

SwingTrends.options = {
  requires: ['swing_points'],
  configuration: {
    allowedSkip: {
      default: 3,
      text: 'Allowed skip amount'
    },
    requiredAccuracy: {
      default: 0.5,
      min: 0,
      max: 1,
      text: 'Required accuracy'
    }
  }
};

module.exports = SwingTrends;
