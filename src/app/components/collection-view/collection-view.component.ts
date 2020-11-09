import { Component, ViewChild, Input, HostListener } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { IIconStyles, IDialogContentProps } from 'office-ui-fabric-react';
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
	locale = enUS.collectionView
	@ViewChild(EditCollectionNamesComponent, {static: true}) editCollectionNamesComponent: EditCollectionNamesComponent
	@Input() uuid: string
	authorMode: AuthorMode = AuthorMode.Normal
	collectionName: {name: string, language: string} = {name: "", language: ""}
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
			coverContent: string,
			coverBlurhash: string
		}[]
	} = {uuid: "", author: "", names: [], books: []}
	collectionNamesDialogVisible: boolean = false
	collectionNames: {name: string, language: string, fullLanguage: string, edit: boolean}[] = []
	showAddLanguageButton: boolean = false
	bookTitleFontSize: number = 20
	hoveredBookIndex: number = -1

	backButtonIconStyles: IIconStyles = {
		root: {
         fontSize: 18
		}
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
		await this.dataService.userPromiseHolder.AwaitResult()
		await this.dataService.userAuthorPromiseHolder.AwaitResult()
		await this.dataService.adminAuthorsPromiseHolder.AwaitResult()

		// Get the collection
		let getCollectionResponse: ApiResponse<any> = await this.apiService.GetStoreBookCollection({
			jwt: this.dataService.user.JWT,
			uuid: this.uuid
		})

		if (getCollectionResponse.status == 200) {
			this.collection = {
				uuid: getCollectionResponse.data.uuid,
				author: getCollectionResponse.data.author,
				names: getCollectionResponse.data.names,
				books: []
			}

			// Get the appropriate collection name
			let i = FindAppropriateLanguage(this.dataService.locale.slice(0, 2), this.collection.names)
			if(i != -1) this.collectionName = this.collection.names[i]

			for (let responseBook of getCollectionResponse.data.books) {
				let book = {
					uuid: responseBook.uuid,
					title: responseBook.title,
					description: responseBook.description,
					language: responseBook.language,
					status: responseBook.status,
					cover: responseBook.cover,
					file: responseBook.file,
					coverContent: null,
					coverBlurhash: null
				}

				// Cut the description
				if(book.description && book.description.length > 170){
					book.description = book.description.slice(0, 169) + "..."
				}

				if (book.cover) {
					book.coverContent = GetStoreBookCoverLink(book.uuid)
					book.coverBlurhash = responseBook.cover_blurhash
				}

				this.collection.books.push(book)
			}
		}else{
			// Redirect back to the author page
			this.router.navigate(["author"])
			return
		}

		// Determine the author mode
		if(
			this.dataService.userIsAdmin &&
			(this.dataService.adminAuthors.findIndex(author => author.uuid == this.collection.author) != -1)
		){
			this.authorMode = AuthorMode.AuthorOfAdmin
		}else if(
			this.dataService.userAuthor &&
			this.collection.author == this.dataService.userAuthor.uuid
		){
			this.authorMode = AuthorMode.AuthorOfUser
		}
	}

	@HostListener('window:resize')
	setSize(){
		this.UpdateFontSize();
	}

	UpdateFontSize(){
		let bookListItems = document.getElementsByClassName('book-list-item');
		if(bookListItems.length == 0) return;

		let bookItemStyles = getComputedStyle(bookListItems.item(0));
		let bookItemWidth = +bookItemStyles.width.replace('px', '');

		if(bookItemWidth <= 360){
			this.bookTitleFontSize = 17;
		}else if(bookItemWidth <= 400){
			this.bookTitleFontSize = 18;
		}else if(bookItemWidth <= 470){
			this.bookTitleFontSize = 19;
		}else{
			this.bookTitleFontSize = 20;
		}
	}

	GoBack(){
		if(this.dataService.userIsAdmin){
			this.router.navigate(["author", this.collection.author]);
		}else{
			this.router.navigate(["author"]);
		}
	}

	NavigateToNewBookPage() {
		let extras: NavigationExtras = {
			queryParams: {collection: this.uuid}
		}

		if (this.dataService.userIsAdmin) {
			extras.queryParams.author = this.collection.author;
		}

		this.router.navigate(["author", "book", "new"], extras);
	}

	NavigateToBook(uuid: string){
		this.router.navigate(["author", "book", uuid]);
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