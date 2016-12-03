var webpack = require('webpack');

module.exports = {
  entry: "./js/main.jsx",
  output: {
    path: "build",
    filename: "bundle.js",
    publicPath: "/static/"
  },

  plugins: [
    // new webpack.DefinePlugin({
    //   'process.env': {
    //     'NODE_ENV': JSON.stringify('production')
    //   }
    // }),
    // new webpack.optimize.OccurrenceOrderPlugin(),
    // new webpack.optimize.UglifyJsPlugin(),
    // new webpack.optimize.DedupePlugin(),
  ],

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
      },

      {
        test: /\.scss$/,
        loader: "style!css!sass"
      }
    ]
  },

  devServer: {
    inline: true,
    progress: true,
    stats: 'errors-only',
    devtool: 'eval-source-map',
    proxy: {
      '/api/*': {
        target: 'http://localhost:8080',
        secure: false
      },
      '/auth/*': {
        target: 'http://localhost:8080',
        secure: false
      }
    }
  }
};