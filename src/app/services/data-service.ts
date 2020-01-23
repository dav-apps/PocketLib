import { Injectable } from "@angular/core";
import * as localforage from 'localforage';
import { DavUser, GetAllTableObjects } from 'dav-npm';
import { environment } from 'src/environments/environment';
import { keys } from 'src/environments/keys';
import * as locales from 'src/locales/locales';
import { Book } from '../models/Book';
import { GetAllBooks, GetBook } from '../models/BookManager';
import { Settings } from '../models/Settings';

@Injectable()
export class DataService{
   user: DavUser;
   locale: string = navigator.language;
   navbarVisible: boolean = true;
	books: Book[] = [];
	currentBook: Book = null;
	darkTheme: boolean = false;
   windowsUiSettings = null;
   settings: Settings;
	settingsLoadPromise: Promise<Settings> = new Promise(resolve => this.settingsLoadPromiseResolve = resolve);
	settingsLoadPromiseResolve: Function;
	settingsSyncPromise: Promise<Settings> = new Promise(resolve => this.settingsSyncPromiseResolve = resolve);
	settingsSyncPromiseResolve: Function;
   syncFinished: boolean = false;
	userPromise: Promise<DavUser> = new Promise(resolve => this.userPromiseResolve = resolve);
	userPromiseResolve: Function;
	userAuthor: {uuid: string, firstName: string, lastName: string, bio: string, collections: {uuid: string, names: {name: string, language: string}[]}[]} = null;
	userAuthorPromise: Promise<{firstName: string, lastName: string, bio: string}> = new Promise(resolve => this.userAuthorPromiseResolve = resolve);
	userAuthorPromiseResolve: Function;

   constructor(){
		this.user = new DavUser(() => this.userPromiseResolve(this.user));
   }

   async LoadAllBooks(){
      this.books = await GetAllBooks();
   }

   async ReloadBook(uuid: string){
      // The book was updated in the database. Get it and replace the old book in the list with the new one
      let book = await GetBook(uuid);
      if(!book) return;

      // Replace or add the book
      let i = this.books.findIndex(b => b.uuid == book.uuid);
      
      if(i !== -1){
         this.books[i] = book;
      }else{
         this.books.push(book);
      }
   }

   async ReloadBookByFile(uuid: string){
      // Find the book with the file uuid
      let tableObjects = await GetAllTableObjects(environment.bookTableId, false);
      let bookObject = tableObjects.find(obj => obj.GetPropertyValue(keys.bookTableFileUuidKey) == uuid);
      if(!bookObject) return;

		await this.ReloadBook(bookObject.Uuid);
   }

   GetLocale(){
      let l = this.locale.toLowerCase();

      if(l.includes("en")){            // en
         if(l == "en-gb")              return locales.enGB;
         else                          return locales.enUS;
      }else if(l.includes("de")){      // de
			if(l == "de-at")					return locales.deAT;
			else if(l == "de-ch")			return locales.deCH;
			else									return locales.deDE;
		}
		
		return locales.enUS;
   }

	async ApplyTheme(theme?: string){
		if(!theme){
			// Get the theme from the settings
			theme = await localforage.getItem(keys.settingsThemeKey);
		}

		switch(theme){
			case keys.darkThemeKey:
				this.darkTheme = true;
				break;
			case keys.systemThemeKey:
				// Get the Windows theme
				if(window["Windows"]){
					if(this.windowsUiSettings == null){
						this.windowsUiSettings = new window["Windows"].UI.ViewManagement.UISettings();
					}

					var color = this.windowsUiSettings.getColorValue(
						window["Windows"].UI.ViewManagement.UIColorType.background
					);

					this.darkTheme = color.r == 0;

					// Observe the system theme
					this.windowsUiSettings.oncolorvalueschanged = () => {
						this.ApplyTheme();
					}

					break;
				}
			default:
				// Light theme
				this.darkTheme = false;
				break;
		}

		document.body.setAttribute(
			keys.themeKey, 
			this.darkTheme ? keys.darkThemeKey : keys.lightThemeKey
		)
   }
   
   HideWindowsBackButton(){
		if(window["Windows"]){
			window["Windows"].UI.Core.SystemNavigationManager.getForCurrentView().appViewBackButtonVisibility = window["Windows"].UI.Core.AppViewBackButtonVisibility.collapsed;
		}
	}
	
	//#region Settings
	async SetTheme(value: string){
		await localforage.setItem(keys.settingsThemeKey, value);
	}

	async GetTheme() : Promise<string>{
		var value = await localforage.getItem(keys.settingsThemeKey) as string;
		return value ? value : keys.settingsThemeDefault;
   }
   
   async SetOpenLastReadBook(value: boolean){
      await localforage.setItem(keys.settingsOpenLastReadBookKey, value);
   }

   async GetOpenLastReadBook() : Promise<boolean>{
      var value = await localforage.getItem(keys.settingsOpenLastReadBookKey) as boolean;
      return value != null ? value : keys.settingsOpenLastReadBookDefault;
   }
	//#endregion
}

export interface ApiResponse{
	status: number;
	headers: any;
	data: any;
}

export function FindElement(currentElement: Element, tagName: string) : Element{
	if(currentElement.tagName.toLowerCase() == tagName) return currentElement;

	for(let i = 0; i < currentElement.children.length; i++){
		let child = currentElement.children.item(i);
		
		let foundElement = FindElement(child, tagName);
		if(foundElement) return foundElement;
	}

	return null;
}

export function SetTextFieldAutocomplete(textFieldId: string, autocomplete: string, setFocus: boolean = false){
	// Find the input element
	let textField = document.getElementById(textFieldId);
	let input = FindElement(textField, "input") as HTMLInputElement;

	if(input){
		if(setFocus) input.focus();

		// Set the autocomplete attribute
		input.setAttribute("autocomplete", autocomplete);
	}
}

export function FindNameWithAppropriateLanguage(targetLanguage: string, names: {name: string, language: string}[]) : number{
	if(names.length == 0) return -1;
	if(names.length == 1) return 0;

	// Try to get the name of the target language
	let i = names.findIndex(n => n.language == targetLanguage);
	if(i != -1) return i;

	// Try to get the name of the default language
	i = names.findIndex(n => n.language == "en");
	if(i != -1) return i;

	// Return the first name
	return 0;
}

export function GetContentAsInlineSource(content: string, contentType: string) : string{
	return `data:${contentType};base64,${btoa(content)}`;
}