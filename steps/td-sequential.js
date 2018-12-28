const Step = require('../step');
const tdSequential = require('tdsequential');

class TDSequential extends Step {
  constructor() {
    super({
      requires: [],
      alertSettings: {
        'Alert on 9': {
          default: true
        },
        'Maximum bar distance': {
          default: 5
        }
      }
    });
  }

  filter(data) {
  }

  execute(data) {
    let objs = [];

    const sellCountdown = (i) => {
      if (i < 4) return 0;
      if (data[i].close > data[i - 4].close) {
        return sellCountdown(i - 1) + 1;
      } else {
        return 0;
      }
    };

    const buyCountdown = (i) => {
      if (i < 4) return 0;
      if (data[i].close < data[i - 4].close) {
        return buyCountdown(i - 1) + 1;
      } else {
        return 0;
      }
    };

    for (let i = 0; i < data.length; i++) {
      let sellCount = sellCountdown(i);
      let buyCount = buyCountdown(i);

      let barDistance = (data.length - i - 1);

      // if (this.getAlertSetting('Alert on 9') === true) {
      //   if (barDistance < this.getAlertSetting('Maximum bar distance')) {
      //     if (sellCount == 9) {
      //       this.alert('Alert on 9', `Sell countdown at 9 (${barDistance == 0 ? 'current bar' : (barDistance) + ' bars away'})`);
      //     } else if (buyCount == 9) {
      //       this.alert('Alert on 9', `Buy countdown at 9 (${barDistance == 0 ? 'current bar' : (barDistance) + ' bars away'})`);
      //     }
      //   }
      // }

      objs.push({ timestamp: data[i].timestamp, sellCountdown: sellCount, buyCountdown: buyCount });
    }


    return objs;
  }
}

module.exports = TDSequential;