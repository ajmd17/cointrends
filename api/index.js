const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const router = require('./router');

const Api = {
  PORT: require('../config.json')['API_PORT'],

  _server: null,

  startServer() {
    const app = express();
    this._server = http.createServer(app);

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use('/api', router());

    mongoose.connect('mongodb://localhost/cointrends');
    this._server.listen(this.PORT);

    console.log('Listening on port ' + this.PORT + '...');

    return Promise.resolve();
  }
};

module.exports = Api;