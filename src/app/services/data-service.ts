import { Injectable } from "@angular/core";
import * as localforage from 'localforage';
import { DavUser, ApiResponse, GetAllTableObjects } from 'dav-npm';
import { ApiService } from './api-service';
import { environment } from 'src/environments/environment';
import { keys } from 'src/environments/keys';
import * as locales from 'src/locales/locales';
import { Book } from '../models/Book';
import { GetAllBooks, GetBook } from '../models/BookManager';
import { Settings } from '../models/Settings';
import { PromiseHolder } from 'src/app/models/PromiseHolder';

const defaultLightStoreBookCoverUrl = "/assets/images/placeholder.png";
const defaultDarkStoreBookCoverUrl = "/assets/images/placeholder-dark.png";
const defaultAvatarUrl = "https://davapps.blob.core.windows.net/avatars/default.png";

@Injectable()
export class DataService{
   user: DavUser;
	locale: string = navigator.language;
   navbarVisible: boolean = true;
	books: Book[] = [];
	currentBook: Book = null;
	darkTheme: boolean = false;
	defaultStoreBookCover: string = this.darkTheme ? defaultDarkStoreBookCoverUrl : defaultLightStoreBookCoverUrl;
	defaultAvatar: string = defaultAvatarUrl;
   settings: Settings;
	settingsLoadPromiseHolder = new PromiseHolder<Settings>();
	settingsSyncPromiseHolder = new PromiseHolder<Settings>();
   syncFinished: boolean = false;
	userPromiseHolder = new PromiseHolder<DavUser>();
	userAuthor: Author = null;
	userAuthorPromiseHolder = new PromiseHolder<Author>();
	adminAuthors: Author[] = [];
	adminAuthorsPromiseHolder = new PromiseHolder<Author[]>();
	userIsAdmin: boolean = false;
	supportedLanguages: {language: string, fullLanguage: string}[] = [];
	sideNavOpened: boolean = false;
	contentHeight: number = 200;
	categories: Category[] = [];
	categoriesPromiseHolder = new PromiseHolder();

	constructor(
		private apiService: ApiService
	){
		this.user = new DavUser(() => {
			this.userIsAdmin = environment.admins.includes(this.user.Id);
			this.userPromiseHolder.Resolve(this.user);
		});

		// Set the supported languages
		let languages = this.GetLocale().misc.languages;
		
		this.supportedLanguages.push(
			{language: "en", fullLanguage: languages.en},
			{language: "de", fullLanguage: languages.de}
		)
	}
	
	async LoadAuthorOfUser(){
		await this.userPromiseHolder.AwaitResult();
		if (this.user.IsLoggedIn) {
			let response: ApiResponse<any> = await this.apiService.GetAuthorOfUser({jwt: this.user.JWT});

			if(response.status == 200){
				if(response.data.authors){
					this.adminAuthors = [];

					for(let author of response.data.authors){
						let newAuthor = {
							uuid: author.uuid,
							firstName: author.first_name,
							lastName: author.last_name,
							bios: author.bios,
							collections: [],
							profileImage: author.profile_image,
							profileImageBlurhash: author.profile_image_blurhash
						}

						// Get the collections of the store books
						newAuthor.collections.push(
							...await this.LoadCollections(author.collections)
						)

						this.adminAuthors.push(newAuthor);
					}
				}else{
					this.userAuthor = {
						uuid: response.data.uuid,
						firstName: response.data.first_name,
						lastName: response.data.last_name,
						bios: response.data.bios,
						collections: [],
						profileImage: response.data.profile_image,
						profileImageBlurhash: response.data.profile_image_blurhash
					}

					// Get the collections and store books
					this.userAuthor.collections.push(
						...await this.LoadCollections(response.data.collections)
					)
				}
			}else{
				this.userAuthor = null;
				this.adminAuthors = [];
			}
		}

		this.userAuthorPromiseHolder.Resolve(this.userAuthor);
		this.adminAuthorsPromiseHolder.Resolve(this.adminAuthors);
	}

	private async LoadCollections(collectionData: any) : Promise<any[]>{
		let collections: any[] = [];

		for(let collection of collectionData){
			let c = await this.apiService.GetStoreBookCollection({
				jwt: this.user.JWT,
				uuid: collection.uuid
			})

			if(c.status == 200){
				let collectionResponseData = (c as ApiResponse<any>).data;

				let newCollection = {
					uuid: collectionResponseData.uuid,
					names: collectionResponseData.names,
					books: []
				}

				// Get the books
				for(let book of collectionResponseData.books){
					let newBook = {
						uuid: book.uuid,
						title: book.title,
						description: book.description,
						language: book.language,
						price: book.price ? parseInt(book.price) : 0,
						status: GetBookStatusByString(book.status),
						cover: book.cover,
						coverContent: book.cover ? GetStoreBookCoverLink(book.uuid) : null,
						file: book.file
					}

					newCollection.books.push(newBook)
				}

				collections.push(newCollection);
			}
		}

		return collections;
	}

	async LoadCategories() {
		// Get the categories
		let getCategoriesResponse: ApiResponse<any> = await this.apiService.GetCategories();
		this.categories = [];

		// Get the names in the appropriate language
		for(let category of getCategoriesResponse.data.categories){
			let currentLanguageIndex = FindAppropriateLanguage(this.locale.slice(0, 2), category.names);
			let currentLanguage = category.names[currentLanguageIndex];
			
			this.categories.push({
				key: category.key,
				name: currentLanguage.name,
				language: currentLanguage.language
			});
		}

		this.categoriesPromiseHolder.Resolve();
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
      let bookObject = tableObjects.find(obj => obj.GetPropertyValue(keys.bookTableFileKey) == uuid);
      if(!bookObject) return;

		await this.ReloadBook(bookObject.Uuid);
	}
	
	GetFullLanguage(language: string) : string{
		let languagesLocale = this.GetLocale().misc.languages;
	
		switch(language){
			case "en":
				return languagesLocale.en;
			case "de":
				return languagesLocale.de;
		}
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
			theme = await this.GetTheme();
		}

		switch(theme){
			case keys.darkThemeKey:
				this.darkTheme = true;
				break;
			case keys.systemThemeKey:
				// Get the browser theme
				let darkTheme = false;

				if (window.matchMedia) {
					let colorScheme = window.matchMedia('(prefers-color-scheme: dark)');

					darkTheme = colorScheme.matches;
					colorScheme.onchange = () => this.ApplyTheme();
				}

				this.darkTheme = darkTheme;
				break;
			default:
				// Light theme
				this.darkTheme = false;
				break;
		}

		document.body.setAttribute(
			keys.themeKey, 
			this.darkTheme ? keys.darkThemeKey : keys.lightThemeKey
		)

		this.defaultStoreBookCover = this.darkTheme ? defaultDarkStoreBookCoverUrl : defaultLightStoreBookCoverUrl;
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

export interface Author{
	uuid: string
	firstName: string
	lastName: string
	bios: {
		bio: string,
		language: string
	}[]
	collections: {
		uuid: string,
		names: {
			name: string,
			language: string
		}[],
		books: {
			uuid: string,
			title: string,
			description: string,
			language: string,
			status: BookStatus,
			cover: boolean,
			coverContent: string,
			coverBlurhash: string,
			file: boolean
		}[]
	}[]
	profileImage: boolean
	profileImageBlurhash: string
}

export interface Category{
	key: string;
	name: string;
	language: string;
}

export enum AuthorMode{
	Normal = 0,			// If the user is not an author and not an admin or an admin but author does not belong to admin
	AuthorOfUser = 1,	// If the author belongs to the user
	AuthorOfAdmin = 2	// If the user is an admin and the author belongs to the admin
}

export enum BookStatus{
	Unpublished = 0,
	Review = 1,
	Published = 2,
	Hidden = 3
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

export function FindAppropriateLanguage(targetLanguage: string, objects: {language: string}[]) : number{
	if(objects.length == 0) return -1;
	if(objects.length == 1) return 0;

	// Try to get the name of the target language
	let i = objects.findIndex(n => n.language == targetLanguage);
	if(i != -1) return i;

	// Try to get the name of the default language
	i = objects.findIndex(n => n.language == "en");
	if(i != -1) return i;

	// Return the first name
	return 0;
}

export function GetContentAsInlineSource(content: string, contentType: string) : string{
	return `data:${contentType};base64,${btoa(content)}`;
}

export function GetBookStatusByString(status: string) : BookStatus{
	switch(status){
		case "published":
			return BookStatus.Published;
		case "review":
			return BookStatus.Review;
		case "hidden":
			return BookStatus.Hidden;
		default:
			return BookStatus.Unpublished;
	}
}

export function GetAuthorProfileImageLink(uuid: string){
	return `${environment.apiBaseUrl}/api/1/call/author/${uuid}/profile_image`;
}

export function GetStoreBookCoverLink(uuid: string){
	return `${environment.apiBaseUrl}/api/1/call/store/book/${uuid}/cover`;
}