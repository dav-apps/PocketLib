var path = require('path');
var express = require('express');

var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

function getRoot(request, response) {
	response.sendFile(path.resolve('./PocketLib/index.html'));
}

function getUndefined(request, response) {
	response.sendFile(path.resolve('./PocketLib/index.html'));
}

app.use(express.static('./PocketLib'));

app.get('/', getRoot);
app.get('/*', getUndefined);

io.on('connection', (socket) => {
	console.log("Connection established!");

	socket.on('message', (message) => {
		console.log(message);
	});
});

http.listen(3001);