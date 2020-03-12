import { Component, ViewChild, Input } from '@angular/core';
import { Router } from '@angular/router';
import { IIconStyles, IDialogContentProps, IButtonStyles } from 'office-ui-fabric-react';
import { EditCollectionNamesComponent } from 'src/app/components/edit-collection-names/edit-collection-names.component';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
import {
	DataService,
	ApiResponse,
	FindAppropriateLanguage,
	DownloadStoreBookCoverAsBase64,
	AuthorMode
} from 'src/app/services/data-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-collection-view',
	templateUrl: './collection-view.component.html'
})
export class CollectionViewComponent{
	locale = enUS.collectionView;
	@ViewChild(EditCollectionNamesComponent, {static: true})
	private editCollectionNamesComponent: EditCollectionNamesComponent;
	@Input() uuid: string;
	authorMode: AuthorMode = AuthorMode.Normal;
	collectionName: {name: string, language: string} = {name: "", language: ""};
	collection: {
		uuid: string,
		author: string,
		names: {name: string, language: string}[],
		books: {
			uuid: string,
			title: string,
			description: string,
			language: string,
			status: string,
			cover: boolean,
			file: boolean,
			coverContent: string
		}[]
	} = {uuid: "", author: "", names: [], books: []};
	coverDownloadPromiseResolve: Function;
	createBookDialogVisible: boolean = false;
	createBookDialogTitle: string = "";
	createBookDialogTitleError: string = "";
	collectionNamesDialogVisible: boolean = false;
	collectionNames: {name: string, language: string, fullLanguage: string, edit: boolean}[] = [];
	showAddLanguageButton: boolean = false;
	getCollectionPromise: Promise<null> = new Promise((resolve) => this.getCollectionPromiseResolve = resolve);
	getCollectionPromiseResolve: Function;

	backButtonIconStyles: IIconStyles = {
		root: {
         fontSize: 18
		}
	}
	dialogPrimaryButtonStyles: IButtonStyles = {
		root: {
			marginLeft: 10
		}
	}
	createBookDialogContentProps: IDialogContentProps = {
		title: this.locale.createBookDialog.title
	}
	collectionNamesDialogContentProps: IDialogContentProps = {
		title: this.locale.collectionNamesDialog.title
	}

	constructor(
		public dataService: DataService,
		private websocketService: WebsocketService,
		private router: Router
	){
		this.locale = this.dataService.GetLocale().collectionView;
	}

	async ngOnInit(){
		// Wait for the user to be loaded
		await this.dataService.userPromise;
		await this.dataService.userAuthorPromise;
		await this.dataService.adminAuthorsPromise;

		// Get the collection
		this.GetStoreBookCollectionResponse(
			await this.websocketService.Emit(WebsocketCallbackType.GetStoreBookCollection, {
				jwt: this.dataService.user.JWT,
				uuid: this.uuid
			})
		)

		await this.getCollectionPromise;

		// Determine the author mode
		if(
			this.dataService.userIsAdmin &&
			(this.dataService.adminAuthors.findIndex(author => author.uuid == this.collection.author) != -1)
		){
			this.authorMode = AuthorMode.AuthorOfAdmin;
		}else if(
			this.dataService.userAuthor &&
			this.collection.author == this.dataService.userAuthor.uuid
		){
			this.authorMode = AuthorMode.AuthorOfUser;
		}
	}

	GoBack(){
		if(this.dataService.userIsAdmin){
			this.router.navigate(["author", this.collection.author]);
		}else{
			this.router.navigate(["author"]);
		}
	}

	ShowBook(uuid: string){
		this.router.navigate(["author", "book", uuid]);
	}

	ShowCreateBookDialog(){
		this.createBookDialogTitle = "";
		this.createBookDialogTitleError = "";

		this.createBookDialogContentProps.title = this.locale.createBookDialog.title;
		this.createBookDialogVisible = true;
	}

	async CreateBook(){
		this.createBookDialogTitleError = "";

		this.CreateStoreBookResponse(
			await this.websocketService.Emit(WebsocketCallbackType.CreateStoreBook, {
				jwt: this.dataService.user.JWT,
				collection: this.uuid,
				title: this.createBookDialogTitle,
				language: this.dataService.locale.startsWith("de") ? "de" : "en"
			})
		)
	}

	ShowCollectionNamesDialog(){
		// Update the collection names for the EditCollectionNames component
		this.collectionNames = [];
		let languages = this.dataService.GetLocale().misc.languages;

		for(let collectionName of this.collection.names){
			this.collectionNames.push({
				name: collectionName.name, 
				language: collectionName.language, 
				fullLanguage: collectionName.language == "de" ? languages.de : languages.en,
				edit: false
			});
		}

		this.collectionNamesDialogContentProps.title = this.locale.collectionNamesDialog.title;
		this.collectionNamesDialogVisible = true;

		setTimeout(() => {
			this.editCollectionNamesComponent.Init();
		}, 1);
	}

	UpdateCollectionName(collectionName: {name: string, language: string}){
		if(this.collectionName.language == collectionName.language){
			// Update the title
			this.collectionName.name = collectionName.name;
		}else{
			let i = this.collection.names.findIndex(name => name.language == collectionName.language);
			if(i == -1){
				// Add the name to the collection
				this.collection.names.push(collectionName);

				// Set the title of the name for the current language was just added
				let j = FindAppropriateLanguage(this.dataService.locale.slice(0, 2), this.collection.names);
				if(j != -1) this.collectionName = this.collection.names[j];
			}else{
				// Update the name in the collection
				this.collection.names[i].name = collectionName.name;
			}
		}
	}

	AddLanguage(){
		this.editCollectionNamesComponent.AddLanguage();
	}

	async GetStoreBookCollectionResponse(response: ApiResponse){
		if(response.status == 200){
			this.collection = response.data;

			// Get the appropriate collection name
			let i = FindAppropriateLanguage(this.dataService.locale.slice(0, 2), this.collection.names);
			if(i != -1) this.collectionName = this.collection.names[i];

			for(let book of this.collection.books){
				// Cut the description
				if(book.description && book.description.length > 170){
					book.description = book.description.slice(0, 169) + "...";
				}
			}

			// Download the covers
			for(let book of this.collection.books){
				if(!book.cover) continue;
				book.coverContent = await DownloadStoreBookCoverAsBase64(book.uuid, this.dataService.user.JWT);
			}

			this.getCollectionPromiseResolve();
		}else{
			// Redirect back to the author page
			this.router.navigate(["author"]);
		}
	}

	GetStoreBookCoverResponse(response: ApiResponse){
		this.coverDownloadPromiseResolve(response);
	}

	CreateStoreBookResponse(response: ApiResponse){
		if(response.status == 201){
			this.createBookDialogVisible = false;

			// Redirect to AuthorAppPage
			this.router.navigate(["author", "book", response.data.uuid]);
		}else{
			let errors = response.data.errors;

			for(let error of errors){
				switch(error.code){
					case 2105:
						// Title missing
						this.createBookDialogTitleError = this.locale.createBookDialog.errors.titleMissing;
					case 2304:
						// Title too short
						this.createBookDialogTitleError = this.locale.createBookDialog.errors.titleTooShort;
						break;
					case 2404:
						// Title too long
						this.createBookDialogTitleError = this.locale.createBookDialog.errors.titleTooLong;
						break;
					default:
						// Unexpected error
						this.createBookDialogTitleError = this.locale.createBookDialog.errors.unexpectedError;
						break;
				}
			}
		}
	}
}