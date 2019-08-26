var path = require('path');
var express = require('express');

var websocket = require('./websocket');

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
	websocket.init(socket);
});

http.listen(process.env.PORT || 3001);