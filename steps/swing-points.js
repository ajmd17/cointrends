const Step = require('../step');

class SwingPoints extends Step {
  constructor() {
    super();
  }

  execute(data, { fractals }) {
    let points = [];

    for (let key in fractals) {
      

      for (let i = 0; i < fractals[key].length; i++) {
        let dataObj = data[fractals[key][i].index];

        if (i > 0) {
          let prevObj = data[fractals[key][i - 1].index];
          let resultObj = {
            i1: fractals[key][i].index,
            t1: dataObj.timestamp,
            i2: fractals[key][i - 1].index,
            t2: prevObj.timestamp,
            class: null
          };

          let highLow = { up: 'L', down: 'H' }[key];

          if (highLow == 'H') {
            if (dataObj.high > prevObj.high) {
              resultObj.class = 'HH';
            } else if (dataObj.high < prevObj.high) {
              resultObj.class = 'LH';
            } else {
              resultObj.class = 'EH';
            }
          } else if (highLow == 'L') {
            if (dataObj.high > prevObj.high) {
              resultObj.class = 'HL';
            } else if (dataObj.high < prevObj.high) {
              resultObj.class = 'LL';
            } else {
              resultObj.class = 'EL';
            }
          }

          points.push(resultObj);
        }
      }
    }

    return points;
  }
}

SwingPoints.options = {
  requires: ['fractals'],
  configuration: {
    useCandleClose: {
      default: false,
      allowed: [true, false],
      text: 'Use candle close'
    }
  }
};

module.exports = SwingPoints;