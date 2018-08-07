const Monitor = require('./monitor');

const startDate = new Date();
startDate.setDate(startDate.getDate() - 1);

const monitor = new Monitor(startDate, {
  onFetch(start, end) {
    let duration = ((new Date(end).valueOf() - new Date(start).valueOf()) / 60000).toFixed(2);
    console.log('Fetch remote - ' + duration + 'm range');

    const delay = Math.random() * 100;
    //console.log('artificial delay ' + delay);

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let res = [];

        for (let i = start; i <= end; i+=monitor.mainQueryRange.interval) {
          res.push({ timestamp: i, close: Math.random(), open: Math.random(), high: Math.random(), low: Math.random(), volume: Math.random() *1000 });
        }

        resolve(res);
      }, delay);
    });
  },
  onResults(results) {
    console.log('Results', results);
  }
});

monitor.start();