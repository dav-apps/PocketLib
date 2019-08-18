var webpack = require('webpack');
var path = require('path');
var fs = require('fs');

var nodeModules = {};
fs.readdirSync('node_modules')
  	.filter(function(x) {
   	return ['.bin'].indexOf(x) === -1;
  	})
  	.forEach(function(mod) {
   	nodeModules[mod] = 'commonjs ' + mod;
  	});

module.exports = {
	entry: { server: './server.js' },
	resolve: { extensions: ['.js'] },
	target: 'node',
	mode: 'none',
	externals: [/node_modules/],
	output:  {
		path: path.join(__dirname, 'dist'),
		filename: 'server.js'
	},
	externals: nodeModules
};