import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IDropdownOption } from 'office-ui-fabric-react';
import { DataService, ApiResponse } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-edit-collection-names',
	templateUrl: './edit-collection-names.component.html'
})
export class EditCollectionNamesComponent{
	locale = enUS.editCollectionNames;
	@Input() collectionNames: CollectionName[] = [];
	@Input() supportedLanguages: {language: string, fullLanguage: string}[] = [];
	@Input() uuid: string;
	@Output() update = new EventEmitter();
	@Output() showAddLanguageButton = new EventEmitter();
	@Output() hideAddLanguageButton = new EventEmitter();
	setCollectionNamePromiseResolve: Function;
	addLanguageSelectedKey: string = "default";
	addLanguageOptions: IDropdownOption[] = [];

	constructor(
		private dataService: DataService,
		private websocketService: WebsocketService
	){
		this.locale = this.dataService.GetLocale().editCollectionNames;
	}

	Init(){
		this.addLanguageOptions = [{
			key: "default",
			text: this.locale.selectLanguage
		}];

		for(let lang of this.supportedLanguages){
			if(this.collectionNames.findIndex(name => name.language == lang.language) == -1){
				// Add the language as an option to add
				this.addLanguageOptions.push({
					key: lang.language,
					text: lang.fullLanguage
				});
			}
		}
	}

	AddLanguage(){
		// Find the selected option
		let i = this.addLanguageOptions.findIndex(option => option.key == this.addLanguageSelectedKey);
		if(i == -1) return;

		this.collectionNames.push({
			name: "",
			language: this.addLanguageSelectedKey,
			fullLanguage: this.addLanguageOptions[i].text,
			edit: true,
			errorMessage: ""
		});

		// Remove the selected option and reset the dropdown
		this.addLanguageOptions.splice(i, 1);
		this.addLanguageSelectedKey = "default";
		this.hideAddLanguageButton.emit();
	}

	async UpdateName(collectionName: CollectionName){
		collectionName.errorMessage = "";
		let setCollectionNamePromise: Promise<ApiResponse> = new Promise((resolve) => {
			this.setCollectionNamePromiseResolve = resolve;
		});

		// Update the collection name on the server
		this.SetStoreBookCollectionNameResponse(
			await this.websocketService.Emit(WebsocketCallbackType.SetStoreBookCollectionName, {
				jwt: this.dataService.user.JWT,
				uuid: this.uuid,
				language: collectionName.language,
				name: collectionName.name
			})
		)

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

	AddLanguageDropdownChange(e: {event: MouseEvent, option: {key: string, text: string}}){
		this.addLanguageSelectedKey = e.option.key;
		this.addLanguageSelectedKey == "default" ? this.hideAddLanguageButton.emit() : this.showAddLanguageButton.emit();
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