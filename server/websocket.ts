var socket = null;

export function init(s: any){
	socket = s;
}

export function emit(key: string, message: any){
	if(!socket) return;
   socket.emit(key, message);
}