var path = require("path");
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        menu: "./src/js/menu.jsx",
        background: "./src/js/background.js",
    },
    output: {
        path: path.join(__dirname,"build/js"),
        filename: "[name].js"
    },
	module: {
		loaders: [{
			test: path.join(__dirname, 'src/js/menu.jsx'),
    		loader: 'babel-loader',
			query: {
				presets: ['es2015', 'react']
			}
		}]
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
