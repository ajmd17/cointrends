const express = require('express');
const httpStatus = require('http-status-codes');

const exchanges = require('../exchanges');

function api() {
  const router = express.Router();

  router.get('/:exchange/symbols', (req, res) => {
    const exchange = exchanges[req.params.exchange];

    if (exchange == null) {
      return res.status(httpStatus.BAD_REQUEST).json({
        error: `unknown exchange '${req.params.exchange}'`
      });
    }

    res.json(exchange.symbols);
  });

  router.get('/:exchange/:pair', (req, res) => {
    const {
      interval,
      start,
      end
    } = req.query;

    const exchange = exchanges[req.params.exchange];

    if (exchange == null) {
      return res.status(httpStatus.BAD_REQUEST).json({
        error: `unknown exchange '${req.params.exchange}'`
      });
    }

    const monitor = exchange.monitors[req.params.pair];

    if (monitor == null) {
      return res.status(httpStatus.BAD_REQUEST).json({
        error: `no monitor for pair '${req.params.pair}'`
      });
    }

    const range = monitor.ranges[interval];

    if (range == null) {
      return res.status(httpStatus.BAD_REQUEST).json({
        error: `unrecognized interval '${interval}'`
      });
    }

    range.queryRange.query(Number(start), Number(end)).then((results) => {
      res.json({ results, filters: range.pipeline.dataStore });
    }).catch((err) => {
      console.error('Query error: ', err);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'query error'
      });
    });
  });

  return router;
}

module.exports = api;