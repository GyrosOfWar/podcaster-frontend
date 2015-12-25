var webpack = require('webpack');

module.exports = {
  entry: "./js/main.jsx",
  output: {
    path: "build",
    filename: "bundle.js",
    publicPath: "/public/"
  },
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel',
      query: {
        sourceMap: true,
        plugins: ['transform-react-jsx'],
        presets: ['es2015']
      }
      }]
    },

    devServer: {
      inline: true,
      progress: true,
      stats: 'errors-only',
      devtool: 'eval-source-map',
      proxy: {
        '/api/*': {
          target: 'http://localhost:5501',
          secure: false
        }
      }
    }
};
