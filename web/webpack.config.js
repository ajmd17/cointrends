var path = require('path');
var webpack = require('webpack');
var WebpackShellPlugin = require('webpack-shell-plugin');

module.exports = {
  entry: {
    app: __dirname + '/public/App'
  },
  output: { 
    path: __dirname + '/dist/js', 
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  plugins: [
    new webpack.ProvidePlugin({
      'Promise': 'es6-promise'
    }),
    new webpack.DefinePlugin({
      'DURATIONS': JSON.stringify(require('../durations'))
    })
  ],
  module: {
    rules: [
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        query: {
          presets: ['es2015', 'stage-0', 'react']
        }
      }
    ]
  },
};