var path = require('path');
var express = require('express');
require('dotenv').config();
var index = require('./index');

var app = express();
var http = require('http').createServer(app);

function getRoot(request, response) {
	response.sendFile(path.resolve('./PocketLib/index.html'));
}

function getUndefined(request, response) {
	response.sendFile(path.resolve('./PocketLib/index.html'));
}

app.get('/store/book/:uuid', (req, res) => {
	let uuid = req.params.uuid;
	index.PrepareStoreBookPage(uuid).then(result => res.send(result));
});

app.get('/store/author/:uuid', (req, res) => {
	let uuid = req.params.uuid;
	index.PrepareStoreAuthorPage(uuid).then(result => res.send(result));
});

app.use(express.static('./PocketLib'));

app.get('/', getRoot);
app.get('/*', getUndefined);

http.listen(process.env.PORT || 3001);