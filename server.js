const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const api = require('./api');

const Server = {
  PORT: 8080,

  _server: null,

  start() {
    const app = express();
    this._server = http.createServer(app);

    app.use(bodyParser.json())
      .use('/api', api());

    mongoose.connect('mongodb://localhost/cointrends');
    this._server.listen(this.PORT);

    console.log('Listening on port ' + this.PORT + '...');

    return Promise.resolve();
  }
};

module.exports = Server;