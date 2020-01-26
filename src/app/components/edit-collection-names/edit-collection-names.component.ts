import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DataService, ApiResponse } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-edit-collection-names',
	templateUrl: './edit-collection-names.component.html'
})
export class EditCollectionNamesComponent{
	locale = enUS.editCollectionNames;
	setStoreBookCollectionNameSubscriptionKey: number;
	@Input() collectionNames: CollectionName[] = [];
	@Input() uuid;
	@Output() update = new EventEmitter();
	setCollectionNamePromiseResolve: Function;

	constructor(
		private dataService: DataService,
		private websocketService: WebsocketService
	){
		this.locale = this.dataService.GetLocale().editCollectionNames;
		this.setStoreBookCollectionNameSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.SetStoreBookCollectionName, (response: ApiResponse) => this.SetStoreBookCollectionNameResponse(response));
	}

	ngOnDestroy(){
		this.websocketService.Unsubscribe(this.setStoreBookCollectionNameSubscriptionKey);
	}

	async UpdateName(collectionName: CollectionName){
		collectionName.errorMessage = "";
		let setCollectionNamePromise: Promise<ApiResponse> = new Promise((resolve) => {
			this.setCollectionNamePromiseResolve = resolve;
		});

		// Update the collection name on the server
		this.websocketService.Emit(WebsocketCallbackType.SetStoreBookCollectionName, {
			jwt: this.dataService.user.JWT,
			uuid: this.uuid,
			language: collectionName.language,
			name: collectionName.name
		});

		// Wait for the response
		let setCollectionNameResponse = await setCollectionNamePromise;

		if(setCollectionNameResponse.status == 200){
			collectionName.edit = false;
			this.update.emit(setCollectionNameResponse.data);
		}else{
			switch(setCollectionNameResponse.data.errors[0].code){
				case 2307:
					// Field too short: name
					collectionName.errorMessage = this.locale.errors.nameTooShort;
					break;
				case 2407:
					// Field too long: name
					collectionName.errorMessage = this.locale.errors.nameTooLong;
					break;
				default:
					// Unexpected error
					collectionName.errorMessage = this.locale.errors.unexpectedError;
					break;
			}
		}
	}

	SetStoreBookCollectionNameResponse(response: ApiResponse){
		this.setCollectionNamePromiseResolve(response);
	}
}

interface CollectionName{
	name: string,
	language: string,
	fullLanguage: string,
	edit: boolean,
	errorMessage: string
}