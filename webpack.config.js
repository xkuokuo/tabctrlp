var path = require("path");
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        menu: "./src/js/menu.js",
        content: "./src/js/content.js",
        background: "./src/js/background.js",
    },
    output: {
        path: path.join(__dirname,"build/js"),
        filename: "[name].js"
    },
    plugins: [
        new CopyWebpackPlugin([
            { from: path.join(__dirname,"src/html/"), to: path.join(__dirname,"build/html") },
            { from: path.join(__dirname,"manifest.json"), to: path.join(__dirname,"build") },
            { from: path.join(__dirname,"src/css/"), to: path.join(__dirname,"build/css") },
            { from: path.join(__dirname,"src/img/"), to: path.join(__dirname,"build/img") }
        ])
    ]
}
