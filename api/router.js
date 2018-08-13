const express = require('express');
const httpStatus = require('http-status-codes');

const { User } = require('../models/user');
const authMiddleware = require('./auth-middleware');

const exchanges = require('../exchanges');

function api() {
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