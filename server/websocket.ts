import * as category from './websocket/category';
import * as misc from './websocket/misc';

var socket = null;

export function init(s: any){
	socket = s;
	for(let name in category.sockets) socket.on(name, category.sockets[name]);
	for(let name in misc.sockets) socket.on(name, misc.sockets[name]);
}

export function emit(key: string, message: any){
	if(!socket) return;
   socket.emit(key, message);
}