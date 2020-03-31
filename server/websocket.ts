import * as storeBookCollection from './websocket/store-book-collection';
import * as storeBookCollectionName from './websocket/store-book-collection-name';
import * as storeBook from './websocket/store-book';
import * as storeBookCover from './websocket/store-book-cover';
import * as storeBookFile from './websocket/store-book-file';
import * as book from './websocket/book';
import * as category from './websocket/category';
import * as misc from './websocket/misc';

var socket = null;

export function init(s: any){
	socket = s;
	for(let name in storeBookCollection.sockets) socket.on(name, storeBookCollection.sockets[name]);
	for(let name in storeBookCollectionName.sockets) socket.on(name, storeBookCollectionName.sockets[name]);
	for(let name in storeBook.sockets) socket.on(name, storeBook.sockets[name]);
	for(let name in storeBookCover.sockets) socket.on(name, storeBookCover.sockets[name]);
	for(let name in storeBookFile.sockets) socket.on(name, storeBookFile.sockets[name]);
	for(let name in book.sockets) socket.on(name, book.sockets[name]);
	for(let name in category.sockets) socket.on(name, category.sockets[name]);
	for(let name in misc.sockets) socket.on(name, misc.sockets[name]);
}

export function emit(key: string, message: any){
	if(!socket) return;
   socket.emit(key, message);
}