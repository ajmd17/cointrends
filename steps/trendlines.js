const Step = require('../step');

const jenks = require('../services/jenks');
const regression = require('regression');

function percentDiff(a, b) {
  if (a > b) {
    return Math.abs(1 - b / a);
  } else {
    return Math.abs(1 - a / b);
  }
}

class Trendlines extends Step {
  constructor(threshold=0.002) {
    super({
      requires: ['fractals'],
      isRealtime: false
    });

    this.threshold = threshold;
  }

  filter(data) {
  }

  execute(data, { fractals }) {
    //data = data.slice(Math.max(data.length - 250, 0), data.length);
    let lines = [];

    const getPassthroughs = (a, b, direction, regr) => {
      const result = [];

      let firstDataIndex = data.findIndex(x => x.timestamp == a.timestamp);
      let lastDataIndex = data.findIndex(x => x.timestamp == b.timestamp);

      for (let i = firstDataIndex + 1; i < lastDataIndex && i < data.length; i++) {
        let dataItem = data[i];
  
        let xValue = dataItem.timestamp/1000000000;
        let prediction = regr.predict(xValue)[1];
        let pdiff = percentDiff(prediction[1], dataItem.close);
  
        if (direction == 'up') {
          if (dataItem.close < prediction && Math.abs(prediction - dataItem.close) > 40/* @TODO: some kind of auto-adjust for Timeframe + asset*/) {
            result.push(Object.assign({ timestamp: dataItem.timestamp }, prediction, dataItem));
          }
        } else {
          if (dataItem.close > prediction && Math.abs(dataItem.close - prediction) > 40/* @TODO: some kind of auto-adjust for Timeframe + asset*/) {
            result.push(Object.assign({ timestamp: dataItem.timestamp }, prediction, dataItem));
          }
        }
      }

      return result;
    };

    let fractalData = {};

    Object.keys(fractals).forEach((key) => {
      let f = fractalData[key] = fractals[key].map(({ index }) => data[index]);
      
      f.forEach((fractal, index) => {
        let inRange = [];
        let pt = key == 'up' ? fractal.low : fractal.high;

        for (let i = 1; i <= 10; i++) {
          if (index + i >= f.length) return;

          let nextFractal = f[index + i];
          let bPt = key == 'up' ? nextFractal.low : nextFractal.high;
          let data = [[fractal.timestamp/1000000000, pt], [nextFractal.timestamp/1000000000, bPt]];
          //console.log('data = ', data);
          let regr = regression.linear(data);
          let direction = key;

          if (getPassthroughs(fractal, nextFractal, direction, regr).length == 0) {
            lines.push({
              a: fractal,
              b: nextFractal,
              pt,
              bPt,
              contactPoints: [fractal, nextFractal],
              direction,
              strength: 0,
              passThroughs: [],
              numLinesAbove: 0,
              numLinesBelow: 0,
              key,
              index,
              lastIndex: index + i,
              regr
            });
          }
        }
      });
    });

    const allFractals = fractalData.up.map(x => (Object.assign({ direction: 'up' }, x)))
      .concat(fractalData.down.map(x => Object.assign({ direction: 'down' }, x)));
    allFractals.sort((a, b) => a.timestamp - b.timestamp);

    console.log('lines.length = ', lines.length);

    lines.forEach((line) => {
      const { regr, key: mainKey } = line;
      const otherKey = mainKey == 'up' ? 'down' : 'up';

      
      let index = fractals[mainKey].findIndex(x => x.timestamp == line.b.timestamp);
      let lastFoundIndex = index;

      console.assert(index != -1);

      for (let i = index + 1; i < fractalData[mainKey].length; i++) {
        //if (i - lastFoundIndex > 5) break;
        let key = fractalData[mainKey][i].direction == 'up' ? 'low' : 'high';

        let xValue = fractalData[mainKey][i].timestamp/1000000000;
        let yValue = fractalData[mainKey][i][key];

        let prediction = regr.predict(xValue);
        let diff = Math.abs(prediction[1] - yValue);
        let pdiff = percentDiff(prediction[1], yValue);

        if (pdiff <= this.threshold) {
          lastFoundIndex = i;
          line.contactPoints.push(fractalData[mainKey][i]);
          line.b = fractalData[mainKey][i];
          line.bPt = fractalData[mainKey][i][key];
          line.lastIndex = i;

          let pointStrength = pdiff / this.threshold;

          line.strength += pointStrength;
        } else {
          //return;
        }

        line.passThroughs = getPassthroughs(line.a, line.b, line.direction, line.regr);
      }
    });

    let blacklist = [];

    for (let i = 0; i < lines.length; i++) {
      if (blacklist.indexOf(i) != -1) continue;
      
      let line = lines[i];

      for (let j = 0; j < lines.length; j++) {
        if (i == j) continue;
        
        // if (blacklist.indexOf(j) != -1) continue;
        let otherLine = lines[j];
        
        if (line.direction != otherLine.direction) continue;

        // let dupCount = 0;
        // for (let k = 0; k < line.contactPoints.length; k++) {
        //   if (otherLine.contactPoints.findIndex(x => x.timestamp == line.contactPoints[k].timestamp) != -1) {
        //     dupCount++;
        //   }

        //   if (dupCount >= 2) {
        //     blacklist.push(j);
        //     break;
        //   }
        // }

        // check for overlap
        // one has to completely overlap the other
        if ((line.a.timestamp >= otherLine.a.timestamp && line.b.timestamp <= otherLine.b.timestamp)
            || (line.a.timestamp <= otherLine.a.timestamp && line.b.timestamp >= otherLine.b.timestamp)) {
          let avg1 = (line.pt + line.bPt) / 2;
          let avg2 = (otherLine.pt + otherLine.bPt) / 2;
          if (avg1 < avg2) {
            line.numLinesAbove++;
          } else if (avg1 > avg2) {
            line.numLinesBelow++;
          }
        }
      }
    }

    // lines = lines.filter((x, i) => blacklist.indexOf(i) == -1);

    let linesByPoint = {};
    let newLines = [];

    for (let i = 0; i < lines.length; i++) {
      if (linesByPoint[lines[i].a.timestamp] == null) {
        linesByPoint[lines[i].a.timestamp] = [];
      }

      linesByPoint[lines[i].a.timestamp].push(lines[i]);
    }

    for (let key in linesByPoint) {
      newLines = newLines.concat(linesByPoint[key]);
    }

    newLines.sort((a, b) => a.timestamp - b.timestamp);
    lines = newLines;

    lines = lines.filter(line => (line.numLinesAbove == 0 || line.numLinesBelow == 0) && line.contactPoints.length > 2/*&& line.passThroughs.length < 3*//*&& line.strength >= 0.6*/);

    return lines;
  }
}

module.exports = Trendlines;