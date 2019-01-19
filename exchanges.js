const request = require('request');

const exchanges = {
  'binance': {
    symbols: ['BTCUSDT', 'ETHUSDT', 'ETHBTC', 'XRPUSDT', 'XRPBTC','EOSUSDT', 'EOSBTC', 'NEOUSDT', 'NEOBTC', 'TRXUSDT', 'TRXBTC', 'ETCUSDT', 'ETCBTC', 'BNBUSDT', 'BNBBTC', 'ADAUSDT', 'ADABTC', 'LTCUSDT', 'LTCBTC', 'XLMUSDT', 'XLMBTC'], /* @TODO: a way to load symbols programmatically */
    monitors: {},
    url: ({ symbol, interval, start, end }) => `https://api.binance.com/api/v1/klines?symbol=${symbol}&interval=${interval}&startTime=${start}&endTime=${end}`,
    transform(obj) {
      const [
        openTime,
        open,
        high,
        low,
        close,
        volume,
        closeTime
      ] = obj;

      return {
        date: new Date(openTime),
        timestamp: new Date(openTime).valueOf(),
        open: +open,
        high: +high,
        low: +low,
        close: +close,
        volume: +volume
      };
    }
  }
};

module.exports = exchanges;