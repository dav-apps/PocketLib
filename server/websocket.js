var loginPage = require('./websocket/login-page');
exports.loginPage = loginPage;

var socket = null;

exports.init = function(s){
   socket = s;
   socket.on(loginPage.loginKey, loginPage.login);
   socket.on(loginPage.getAppKey, loginPage.getApp);
}

exports.emit = function(key, message){
   if(!socket) return;
   socket.emit(key, message);
}