import * as loginPage from './websocket/login-page';

var socket = null;

export function init(s: any){
	socket = s;
	socket.on(loginPage.loginKey, loginPage.login);
	socket.on(loginPage.getAppKey, loginPage.getApp);
}

export function emit(key: string, message: any){
	if(!socket) return;
   socket.emit(key, message);
}