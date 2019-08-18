var express = require('express');

var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use("/", express.static("PocketLib"));

io.on('connection', (socket) => {
	console.log("Connection established!");

	socket.on('message', (message) => {
		console.log(message);
	});
});

http.listen(3001);