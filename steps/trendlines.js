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
  constructor(threshold=0.005) {
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
            result.push(Object.assign({}, prediction, dataItem));
          }
        } else {
          if (dataItem.close > prediction && Math.abs(dataItem.close - prediction) > 40/* @TODO: some kind of auto-adjust for Timeframe + asset*/) {
            result.push(Object.assign({}, prediction, dataItem));
          }
        }
      }

      return result;
    };

    Object.keys(fractals).forEach((key) => {
      let f = fractals[key].map(({ index }) => data[index]);
      
      f.forEach((fractal, index) => {
        let inRange = [];
        let pt = key == 'up' ? fractal.low : fractal.high;

        for (let i = 1; i <= 10; i++) {
          if (index + i >= fractals[key].length) return;

          let nextFractal = fractals[key][index + i];
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
              key,
              index,
              lastIndex: index + i,
              regr
            });
          }
        }
      });
    });

    const allFractals = fractals.up.map(x => (Object.assign({ direction: 'up' }, x)))
      .concat(fractals.down.map(x => Object.assign({ direction: 'down' }, x)));
    allFractals.sort((a, b) => a.timestamp - b.timestamp);

    lines.forEach((line) => {
      const { regr, key: mainKey } = line;
      const otherKey = mainKey == 'up' ? 'down' : 'up';

      
      let index = allFractals.findIndex(x => x.timestamp == line.b.timestamp);
      let lastFoundIndex = index;

      for (let i = index + 1; i < allFractals.length; i++) {
        //if (i - lastFoundIndex > 5) break;
        let key = allFractals[i].direction == 'up' ? 'low' : 'high';
        [key].forEach((attr) => {
          
          let xValue = allFractals[i].timestamp/1000000000;
          let yValue = allFractals[i][attr];
  
          let prediction = regr.predict(xValue);
          let diff = Math.abs(prediction[1] - yValue);
          let pdiff = percentDiff(prediction[1], yValue);

          if (pdiff <= this.threshold) {
            lastFoundIndex = i;
            line.contactPoints.push(allFractals[i]);
            line.b = allFractals[i];
            line.bPt = allFractals[i][attr];
            line.lastIndex = i;

            let pointStrength = pdiff / diffThreshold;

            line.strength += pointStrength;
          }
        });

        line.passThroughs = getPassthroughs(line.a, line.b, line.direction, line.regr);
      }
    });

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

    lines = lines.filter(line => line.contactPoints.length > 2 && line.passThroughs.length < 3/*&& line.strength >= 0.6*/);

    return lines;
  }
}

module.exports = Trendlines;