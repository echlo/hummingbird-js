var path = require("path");
var UglifyJSPlugin = require("uglifyjs-webpack-plugin");

module.exports = {
  entry: {
    index: "./src/hummingbird.js",
    "index.min": "./src/hummingbird.js"
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    library: ["Hummingbird"]
  },
  plugins: [
    new UglifyJSPlugin({
      test: /\.min\.js$/    
    })
  ],
  devServer: {
    port: 9000
  }
};
