import * as loginPage from './websocket/login-page';
import * as authorSetupPage from './websocket/author-setup-page';
import * as authorPage from './websocket/author-page';
import * as authorBookPage from './websocket/author-book-page';

var socket = null;

export function init(s: any){
	socket = s;
	socket.on(loginPage.loginKey, loginPage.login);
	socket.on(loginPage.getAppKey, loginPage.getApp);
	socket.on(authorSetupPage.createAuthorKey, authorSetupPage.createAuthor);
	socket.on(authorSetupPage.getAuthorOfUserKey, authorSetupPage.getAuthorOfUser);
	socket.on(authorPage.createStoreBookKey, authorPage.createStoreBook);
	socket.on(authorPage.updateAuthorOfUserKey, authorPage.updateAuthorOfUser);
	socket.on(authorBookPage.getStoreBookKey, authorBookPage.getStoreBook);
	socket.on(authorBookPage.updateStoreBookKey, authorBookPage.updateStoreBook);
	socket.on(authorBookPage.getStoreBookCoverKey, authorBookPage.getStoreBookCover);
	socket.on(authorBookPage.setStoreBookCoverKey, authorBookPage.setStoreBookCover);
	socket.on(authorBookPage.setStoreBookFileKey, authorBookPage.setStoreBookFile);
}

export function emit(key: string, message: any){
	if(!socket) return;
   socket.emit(key, message);
}