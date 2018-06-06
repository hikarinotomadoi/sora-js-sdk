/* global __dirname */

const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const banner = pkg.name + '\n' + pkg.description +
  '\n@version: ' + pkg.version + '\n@author: ' + pkg.author + '\n@license: ' + pkg.license;


module.exports = {
  context: path.resolve(__dirname, './src'),
  entry: {
    sora: './sora.js',
    'sora.min': './sora.js',
  },
  output: {
    library: 'Sora',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    path: path.resolve(__dirname, './dist'),
    filename: '[name].js',
  },
  plugins: [
    new webpack.BannerPlugin(banner),
    new UglifyJsPlugin({ include: /\.min\.js$/ })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        use: [{
          loader: 'babel-loader',
          options: { presets: ['es2015'],  plugins: ['transform-flow-strip-types'] }
        }],
      },
    ],
  },
};
