var path = require('path');
var express = require('express');
require('dotenv').config();

var app = express();
var http = require('http').createServer(app);

function getRoot(request, response) {
	response.sendFile(path.resolve('./PocketLib/index.html'));
}

function getUndefined(request, response) {
	response.sendFile(path.resolve('./PocketLib/index.html'));
}

app.use(express.static('./PocketLib'));

app.get('/', getRoot);
app.get('/*', getUndefined);

http.listen(process.env.PORT || 3001);