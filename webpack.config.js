var path = require('path');
const slsw = require('serverless-webpack');

module.exports = {
  entry: slsw.lib.entries,
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js',
  },
  externals: [/aws\-sdk/, /fsevents/],
  target: 'node',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: [
            [
              'env',
              {
                target: { node: '6.10' }, // Node version on AWS Lambda
                useBuiltIns: true,
                modules: false,
                loose: true,
              },
            ],
            'stage-0',
          ],
        },
      },
    ],
  },
};
