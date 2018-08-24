const Step = require('../step');

class TDSequential extends Step {
  constructor() {
    super({
      requires: []
    });
  }

  filter(data) {
  }

  execute(data) {
    let bSetupCounter = 0;

    let TDSL = 0;
    let TDSS = 0;

    let buySetup = 0;
    let sellSetup = 0;
    let buyCountdown = 0;
    let sellCountdown = 0;

    const lows = [];
    const highs = [];

    let buyCounts = [];
    let sellCounts = [];

    let bar8;

    for (let i = 0; i < data.length; i++) {
      //if (i < 9) continue;
      if (i < 5) continue;
      // if (bSetupCounter < 9) {
      //   if (bSetupCounter == 0 && data[i].close < data[i + 4].close && data[i + 1].close > data[i + 5].close) {
      //     bSetupCounter++;

      //   }
      // }

      let bearishFlip;
      let bullishFlip;
      

      if (data[i].close < data[i - 4].close && data[i - 1].close > data[i - 5].close) {
        bearishFlip = 1;
        bullishFlip = 0;
      } else if (data[i].close > data[i - 4].close && data[i - 1].close < data[i - 5].close) {
        bullishFlip = 1;
        bearishFlip = 0;
      }

      if (data[i].close < data[i - 4].close && bearishFlip) {
        TDSL++;
        TDSS = 0;
      } else if (data[i].close > data[i - 4].close && bullishFlip) {
        TDSS++;
        TDSL = 0;
      }

      // console.log('TDSL = ', TDSL);

      // LOWS

      if (TDSL > 0 && TDSL < 10) {
        lows.push(data[i].low);
      }

      if (TDSL == 9) {
        let L = (data[i].low < data[i - 3].low && data[i].low < data[i - 2].low) || (data[i - 1].low < data[i - 2].low && data[i - 1].low < data[i - 3].low);

        bearishFlip = 0;
        TDSL = 0;
        buySetup = 1;

        if (L) {
          // arrow up
        }
      }

      // HIGHS
      if (TDSS > 0 && TDSS < 10) {
        highs.push(data[i].high);
      }

      if (TDSS == 9) {
        let S = (data[i].high > data[i - 2].high && data[i].high > data[i - 3].high) || (data[i - 1].high > data[i - 3].high && data[i - 1].high > data[i - 2].high);

        bullishFlip = 0;
        TDSS = 0;
        sellSetup = 1;

        if (S) {
          // arrow down
        }
      }

      if (buySetup) {
        if (data[i].close <= data[i - 2].low) {
          buyCountdown++;
          // buycountdown
          buyCounts.push({ timestamp: data[i].timestamp, count: buyCountdown });
        }

        if (buyCountdown == 8) {
          bar8 = i;
        } else if (buyCountdown == 13) {
          if (data[i].low <= data[bar8].close) {
            // draw arrow up
          }
          buySetup = 0;
          buyCountdown = 0;
        }
      } else if (sellSetup) {
        if (data[i].close >= data[i - 2].high) {
          sellCountdown++;
          // sellcountdown
          sellCounts.push({ timestamp: data[i].timestamp, count: sellCountdown });
        }

        if (sellCountdown == 8) {
          bar8 = i;
        } else if (sellCountdown == 13) {
          if (data[i].high >= data[bar8].close) {
            // draw arrow down
          }
          sellSetup = 0;
          sellCountdown = 0;
        }
      }

    }

    console.log('highs = ', highs.length)
    console.log('lows = ', lows.length)
    return { buyCounts, sellCounts };

  }
}

module.exports = TDSequential;