import * as loginPage from './websocket/login-page';
import * as authorSetupPage from './websocket/author-setup-page';

var socket = null;

export function init(s: any){
	socket = s;
	socket.on(loginPage.loginKey, loginPage.login);
	socket.on(loginPage.getAppKey, loginPage.getApp);
	socket.on(authorSetupPage.setAuthorOfUserKey, authorSetupPage.setAuthorOfUser);
	socket.on(authorSetupPage.getAuthorOfUserKey, authorSetupPage.getAuthorOfUser);
}

export function emit(key: string, message: any){
	if(!socket) return;
   socket.emit(key, message);
}