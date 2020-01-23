import { Injectable } from "@angular/core";
declare var io: any;

@Injectable()
export class WebsocketService{
	private socket: any;
	private subscriptions: WebsocketSubscription[] = [];
	private counter: number = 0;

	constructor(){
		this.socket = io();
		
		for(let key of Object.keys(Callbacks)){
			this.socket.on(key, (message: any) => {
				for(let subscription of this.subscriptions){
					if(subscription.type == +Callbacks[key]) subscription.callback(message);
				}
			});
		}
	}

	Subscribe(type: WebsocketCallbackType, callback: Function) : number{
		let key = this.counter++;

		this.subscriptions.push({
			key,
			type,
			callback
		});

		return key;
	}

	Unsubscribe(...keys: number[]){
		for(let key of keys){
			let i = this.subscriptions.findIndex(c => c.key == key);

			if(i !== -1){
				this.subscriptions.splice(i, 1);
			}
		}
	}

	Emit(type: WebsocketCallbackType, message: any){
		let key = getKeyByValue(Callbacks, type);

		if(key) this.socket.emit(key, message);
	}
}

interface WebsocketSubscription{
	key: number;
	type: WebsocketCallbackType;
	callback: Function;
}

export enum WebsocketCallbackType{
	Login = 1,
	GetApp = 2,
	CreateAuthor = 3,
	GetAuthorOfUser = 4,
	CreateStoreBook = 5,
	UpdateAuthorOfUser = 6,
	SetProfileImageOfAuthorOfUser = 7,
	GetStoreBook = 8,
	UpdateStoreBook = 9,
	GetStoreBookCover = 10,
	SetStoreBookCover = 11,
	SetStoreBookFile = 12,
	GetStoreBookCollection = 13
}

export const Callbacks = {
	login: WebsocketCallbackType.Login,
	getApp: WebsocketCallbackType.GetApp,
	createAuthor: WebsocketCallbackType.CreateAuthor,
	getAuthorOfUser: WebsocketCallbackType.GetAuthorOfUser,
	createStoreBook: WebsocketCallbackType.CreateStoreBook,
	updateAuthorOfUser: WebsocketCallbackType.UpdateAuthorOfUser,
	setProfileImageOfAuthorOfUser: WebsocketCallbackType.SetProfileImageOfAuthorOfUser,
	getStoreBook: WebsocketCallbackType.GetStoreBook,
	updateStoreBook: WebsocketCallbackType.UpdateStoreBook,
	getStoreBookCover: WebsocketCallbackType.GetStoreBookCover,
	setStoreBookCover: WebsocketCallbackType.SetStoreBookCover,
	setStoreBookFile: WebsocketCallbackType.SetStoreBookFile,
	getStoreBookCollection: WebsocketCallbackType.GetStoreBookCollection
}

function getKeyByValue(object: any, value: any) {
	return Object.keys(object).find(key => object[key] === value);
}