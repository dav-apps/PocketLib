import { Component, ViewChild, Input } from '@angular/core';
import { Router } from '@angular/router';
import { IIconStyles, IDialogContentProps, IButtonStyles } from 'office-ui-fabric-react';
import { ApiResponse } from 'dav-npm';
import { EditCollectionNamesComponent } from 'src/app/components/edit-collection-names/edit-collection-names.component';
import {
	DataService,
	FindAppropriateLanguage,
	GetStoreBookCoverLink,
	AuthorMode
} from 'src/app/services/data-service';
import { ApiService } from 'src/app/services/api-service';
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
	createBookDialogVisible: boolean = false;
	createBookDialogTitle: string = "";
	createBookDialogTitleError: string = "";
	collectionNamesDialogVisible: boolean = false;
	collectionNames: {name: string, language: string, fullLanguage: string, edit: boolean}[] = [];
	showAddLanguageButton: boolean = false;

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
		private apiService: ApiService,
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
		let getCollectionResponse: ApiResponse<any> = await this.apiService.GetStoreBookCollection(
			this.uuid,
			this.dataService.user.JWT
		)

		if(getCollectionResponse.status == 200){
			this.collection = getCollectionResponse.data;

			// Get the appropriate collection name
			let i = FindAppropriateLanguage(this.dataService.locale.slice(0, 2), this.collection.names);
			if(i != -1) this.collectionName = this.collection.names[i];

			for(let book of this.collection.books){
				// Cut the description
				if(book.description && book.description.length > 170){
					book.description = book.description.slice(0, 169) + "...";
				}

				if(book.cover){
					book.coverContent = GetStoreBookCoverLink(book.uuid);
				}
			}
		}else{
			// Redirect back to the author page
			this.router.navigate(["author"]);
			return;
		}

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

		let response: ApiResponse<any> = await this.apiService.CreateStoreBook(
			this.dataService.user.JWT,
			this.uuid,
			this.createBookDialogTitle,
			this.dataService.locale.startsWith("de") ? "de" : "en"
		)

		if(response.status == 201){
			this.createBookDialogVisible = false;

			// Redirect to AuthorAppPage
			this.router.navigate(["author", "book", response.data.uuid]);
		}else{
			for(let error of response.data.errors){
				switch(error.code){
					case 2105:
						// Title missing
						this.createBookDialogTitleError = this.locale.createBookDialog.errors.titleMissing;
						break;
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
}