const express = require('express');
const httpStatus = require('http-status-codes');
const _ = require('lodash');

const { User } = require('../models/user');
const { Chart } = require('../models/chart');
const { CustomPipeline } = require('../models/custom-pipeline');
const authMiddleware = require('./auth-middleware');

const Pipeline = require('../pipeline');
const exchanges = require('../exchanges');
const steps = require('../steps');

function api() {
  const createCustomPipeline = (range, { indicators, exchange, pair, interval }) => {
    let pipelineSteps = [];

    for (let s of indicators) {
      let { name, config } = s;
      let stepName = Object.keys(steps).find((stepName) => name == _.snakeCase(stepName));
      let step = steps[stepName];
      pipelineSteps.push(step); /** @TODO specified configuration */
    }

    return new CustomPipeline({
      exchange,
      pair,
      interval,
      indicators
      /** @TODO expiry based on user status */
    }).save().then((customPipeline) => {
      range.customPipelines[customPipeline._id] = new Pipeline(pipelineSteps, {
        autoIncludeRequirements: true
      });

      return customPipeline;
    }).catch((err) => {
      console.error('Failed to create CustomPipeline:', err);
      throw err;
    });
  };

  const router = express.Router();

  router.post('/login', (req, res) => {
    if (req.body.email === undefined) {
      return res.status(httpStatus.BAD_REQUEST).json({
        error: 'email unprovided'
      });
    }
    if (req.body.password === undefined) {
      return res.status(httpStatus.BAD_REQUEST).json({
        error: 'password unprovided'
      });
    }
    
    User.findOne({
      email: new RegExp('^' + req.body.email + '$', 'i')
    }).then((user) => {
      if (user == null) {
        return res.json({
          error: 'Not a registered account'
        });
      }
  
      bcrypt.compare(req.body.password, user.passwordHash, (err, success) => {
        if (err) {
          debug.error('Error comparing passwords:', err);
          return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            error: err.message
          });
        }
        
        if (!success) {
          return res.json({
            error: 'Password incorrect'
          });
        }
  
        user.update({ $set: { lastLoginDate: new Date } }).then(() => {
          const token = jwt.sign({
            uid: user._id,
            email: user.email
          }, config['JWT_TOKEN_SECRET']);
  
          res.json({ user, token });
        }).catch(err => debug.error(`Failed to update lastLoginDate for user ${user._id}`, err));
      });
    }).catch((err) => {
      debug.error('Error finding user:', err);
      res.status(httpStatus.BAD_REQUEST).json({
        error: err.message
      });
    });
  });

  router.put('/user/:userid/alerts/:alert', authMiddleware, (req, res) => {
    if (req.decoded.uid != req.params.userid) {
      return res.status(httpStatus.FORBIDDEN).json({
        error: 'not authorized to access user'
      });
    }

    if (req.body.value === undefined) {
      return res.status(httpStatus.BAD_REQUEST).json({
        error: 'value unprovided'
      });
    }

    User.findById(req.params.userid).then((user) => {
      if (user == null) {
        return res.status(httpStatus.NOT_FOUND).json({
          error: 'user not found'
        });
      }

      if (typeof req.body.value === 'object') {
        if (typeof user.alertOptions[req.params.alert] !== 'object') {
          user.alertOptions[req.params.alert] = {};
        }

        for (let key in req.body.value) {
          user.alertOptions[req.params.alert][key] = req.body.value[key];
        }
      } else {
        user.alertOptions[req.params.alert] = req.body.value;
      }

      user.save().then(() => {
        res.sendStatus(httpStatus.OK);
      }).catch((err) => {
        console.error('Failed to save user: ', err);
        res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
      });
    }).catch((err) => {
      console.error('Internal error: ', err);
      res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  router.get('/exchange/:exchange/symbols', (req, res) => {
    const exchange = exchanges[req.params.exchange];

    if (exchange == null) {
      return res.status(httpStatus.BAD_REQUEST).json({
        error: `unknown exchange '${req.params.exchange}'`
      });
    }

    res.json(exchange.symbols);
  });

  router.get('/exchange/:exchange/:pair', (req, res) => {
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

  router.post('/pipeline/create', (req, res) => {
    let {
      indicators,
      interval,
      exchange,
      pair
    } = req.body;

    const ex = exchanges[exchange];

    if (ex == null) {
      return res.status(httpStatus.BAD_REQUEST).json({
        error: `unknown exchange '${exchange}'`
      });
    }

    const monitor = ex.monitors[pair];

    if (monitor == null) {
      return res.status(httpStatus.BAD_REQUEST).json({
        error: `no monitor for pair '${pair}'`
      });
    }

    const range = monitor.ranges[interval];

    if (range == null) {
      return res.status(httpStatus.BAD_REQUEST).json({
        error: `unrecognized interval '${interval}'`
      });
    }

    createCustomPipeline(range, indicators).then((customPipeline) => {
      res.json({ customPipeline });
    }).catch((err) => {
      res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
    })
  });

  router.post('/chart/create', (req, res) => {
    let {
      interval,
      exchange,
      pair,
      pipelines
    } = req.body;

    const ex = exchanges[exchange];

    if (ex == null) {
      return res.status(httpStatus.BAD_REQUEST).json({
        error: `unknown exchange '${exchange}'`
      });
    }

    const monitor = ex.monitors[pair];

    if (monitor == null) {
      return res.status(httpStatus.BAD_REQUEST).json({
        error: `no monitor for pair '${pair}'`
      });
    }

    let promises = [];

    for (let key in pipelines) {
      const range = monitor.ranges[interval];

      if (range == null) {
        return res.status(httpStatus.BAD_REQUEST).json({
          error: `unrecognized interval '${interval}'`
        });
      }

      promises.push(() => {
        return createCustomPipeline(range, pipelines[key]).then((customPipeline) => {
          return customPipeline;
        });
      });
    }

    Promise.all(promises.map((x) => x())).then((pipelines) => {
      return new Chart({
        exchange,
        interval,
        pair,
        pipelines: pipelines.map((p) => p._id)
      }).save().then((chart) => {
        return chart;
      }).catch((err) => {
        console.error('Failed to save Chart: ', err);
        throw err;
      });
    }).then((chart) => {
      res.json({ chart });
    }).catch((err) => {
      res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  router.get('/chart/:id', (req, res) => {
    Chart.findById(req.params.id).populate('pipelines').then((chart) => {
      res.json({ chart });
    }).catch((err) => {
      console.error(`Failed to load chart with id '${req.params.id}'`, err);
      res.sendStatus(httpStatus.NOT_FOUND);
    });
  });

  router.get('/indicators', (req, res) => {
    let indicators = {};

    Object.keys(steps).map((key) => {
      let options = steps[key].options || {};

      if (!options.configuration) options.configuration = {};
      if (!options.alerts) options.alerts = {};

      indicators[_.snakeCase(key)] = {
        name: _.startCase(key),
        configuration: options.configuration,
        alerts: options.alerts
      };
    });

    res.json({ indicators });
  });

  // router.get('/pipeline/:pipelineId', (req, res) => {
  //   const {
  //     exchange,
  //     pair,
  //     interval
  //   } = req.query;

  //   const exchange = exchanges[exchange];

  //   if (exchange == null) {
  //     return res.status(httpStatus.BAD_REQUEST).json({
  //       error: `unknown exchange '${exchange}'`
  //     });
  //   }

  //   const monitor = exchange.monitors[pair];

  //   if (monitor == null) {
  //     return res.status(httpStatus.BAD_REQUEST).json({
  //       error: `no monitor for pair '${pair}'`
  //     });
  //   }

  //   const range = monitor.ranges[interval];

  //   if (range == null) {
  //     return res.status(httpStatus.BAD_REQUEST).json({
  //       error: `unrecognized interval '${interval}'`
  //     });
  //   }

  //   const pipeline = range.customPipelines[req.params.pipelineId];

  //   if (pipeline == null) {
  //     return res.status(httpStatus.BAD_REQUEST).json({
  //       error: `no pipeline with id ${req.params.pipelineId} matching the supplied parameters`
  //     });
  //   }

  //   res.json({

  //   });
  // });

  return router;
}

module.exports = api;