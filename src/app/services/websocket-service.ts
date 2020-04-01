import { Injectable } from "@angular/core";
declare var io: any;

@Injectable()
export class WebsocketService{
	private socket: any;
	private subscriptions: WebsocketSubscription[] = [];

	constructor(){
		this.socket = io();
		
		for(let key of Object.keys(Callbacks)){
			this.socket.on(key, (message: any) => {
				let i = this.subscriptions.findIndex(s => s.type == Callbacks[key]);
				if(i != -1){
					this.subscriptions[i].resolve(message);
					this.subscriptions.splice(i, 1);
				}
			});
		}
	}

	async Emit(type: WebsocketCallbackType, message: any){
		let key = getKeyByValue(Callbacks, type);
		if(!key) return;

		let r: Function;
		let socketPromise: Promise<any> = new Promise((resolve: Function) => {
			r = resolve;
		});

		this.subscriptions.push({
			type,
			resolve: r
		});

		this.socket.emit(key, message);
		return await socketPromise;
	}
}

interface WebsocketSubscription{
	type: WebsocketCallbackType;
	resolve: Function;
}

export enum WebsocketCallbackType{
	// StoreBook
	GetStoreBooksInReview,
	UpdateStoreBook,
	// StoreBookCover
	SetStoreBookCover,
	GetStoreBookCover,
	// StoreBookFile
	SetStoreBookFile,
	// Book
	CreateBook,
	// Category
	GetCategories
	// Misc
}

export const Callbacks = {
	getStoreBooksInReview: WebsocketCallbackType.GetStoreBooksInReview,
	updateStoreBook: WebsocketCallbackType.UpdateStoreBook,
	setStoreBookCover: WebsocketCallbackType.SetStoreBookCover,
	getStoreBookCover: WebsocketCallbackType.GetStoreBookCover,
	setStoreBookFile: WebsocketCallbackType.SetStoreBookFile,
	createBook: WebsocketCallbackType.CreateBook,
	getCategories: WebsocketCallbackType.GetCategories
}

function getKeyByValue(object: any, value: any) {
	return Object.keys(object).find(key => object[key] === value);
}