// this program is separate from the other parts and is for the web component only.

const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);

const assetsFolder = './assets/';
const publicFolder = './public';

global['DEPLOY_VERSION'] = Date.now();

app.use(bodyParser.json())
  .use('/fonts', express.static(path.join(__dirname, assetsFolder + '/fonts'), { maxAge: '30d' }))
  .use('/icons', express.static(path.join(__dirname, assetsFolder + '/icons'), { maxAge: '30d' }))
  .use('/images', express.static(path.join(__dirname, assetsFolder + '/images'), { maxAge: '30d' }))
  .use(`/css/styles_${DEPLOY_VERSION}.css`, express.static(path.join(__dirname, publicFolder + '/css/styles.css'), { maxAge: '30d' }))
  .use(`/css/styles.css`, express.static(path.join(__dirname, publicFolder + '/css/styles.css'), { maxAge: '1d' })) // don't cache as long
  .use(`/js/app_${DEPLOY_VERSION}.js`, express.static(path.join(__dirname, publicFolder + '/js/app.js'), { maxAge: '2d' }))
  .use('/js/*', express.static(path.join(__dirname, publicFolder + '/js'), { maxAge: '2d' }))
  .set('views', path.join(__dirname, assetsFolder + '/templates'))
  .set('view engine', 'ejs');

// start the server
(function (port) {
  server.listen(port);
  console.log('Listening on port ' + port + '...');
})(require('../config.json')['WEB_PORT']);