import { Component, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IIconStyles, SpinnerSize } from 'office-ui-fabric-react';
import { ReadFile } from 'ngx-file-helpers';
import { ApiResponse } from 'dav-npm';
import { DataService, Author, FindAppropriateLanguage } from 'src/app/services/data-service';
import { ApiService } from 'src/app/services/api-service';
import { RoutingService } from 'src/app/services/routing-service';
import { EditPriceComponent } from 'src/app/components/edit-price/edit-price.component';

@Component({
	selector: 'pocketlib-new-book-page',
	templateUrl: './new-book-page.component.html'
})
export class NewBookPageComponent{
	//#region General variables
	author: Author = {
		uuid: "",
		firstName: "",
		lastName: "",
		bios: [],
		collections: [],
		profileImage: false
	}
	//#endregion

	//#region Title variables
	title: string = "";
	submittedTitle: string = "";
	titleSubmitted: boolean = false;
	//#endregion

	//#region Collection variables
	collections: {
		uuid: string,
		name: string,
		cover: boolean,
		coverContent: string
	}[] = [];
	selectedCollection: number = -2;
	loadCollectionsPromise: Promise<null> = new Promise(resolve => this.loadCollectionsPromiseResolve = resolve);
	loadCollectionsPromiseResolve: Function;
	noCollections: boolean = false;
	//#endregion

	//#region Description + Language variables
	description: string = "";
	language: string = this.dataService.locale.startsWith("de") ? "de" : "en";
	//#endregion

	//#region Categories variables
	selectedCategories: string[] = [];
	//#endregion

	//#region Price variables
	@ViewChild('editPrice', { static: true }) editPriceComponent: EditPriceComponent;
	price: number = 0;
	//#endregion

	//#region Cover variables
	coverContentBase64: string = "";
	coverContent: ArrayBuffer;
	coverType: string = "";
	//#endregion

	//#region BookFile variables
	bookFileName: string = "";
	bookFileContent: ArrayBuffer;
	bookFileType: string = "";
	//#endregion

	//#region Navigation variables
	section: number = 0;
	visibleSection: number = 0;
	forwardNavigation: boolean = true;
	spinnerSize: SpinnerSize = SpinnerSize.small;
	loading: boolean = false;
	//#endregion

	//#region Sample data variables
	sampleDataIndex: number = 0;
	titleSamples: string[] = [
		"Das winzigste Elflein",
		"Der Wasserkreislauf"
	]
	descriptionSamples: string[] = [
		"Dieses Buch beschreibt die Geschichte von einem klitzekleinen Männchen, das im Märchenwald herumläuft und allerlei entzückende Abenteuer erlebt.",
		"Nachdem die Wissenschaftler der ganzen Welt mit großem Zeitaufwand Ozeane erforscht, Regengüsse untersucht und verschiedene Trinkbrunnen intensiv angestarrt hatten, haben sie eine Theorie dazu entwickelt, wie sich das Wasser auf unserem Planeten verteilt; diese Theorie haben sie den \"Wasserkreislauf\" genannt. Der Wasserkreislauf besteht aus drei zentralen Erscheinungen - Verdunstung, Niederschlag und Abfluss -, und alle drei sind gleich langweilig."
	]
	//#endregion

	backButtonIconStyles: IIconStyles = {
		root: {
         fontSize: 18
		}
	}

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private routingService: RoutingService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	){
		this.sampleDataIndex = this.RandomInteger(0, this.titleSamples.length - 1);
	}

	async ngOnInit() {
		await this.dataService.userAuthorPromise;

		// Get the author
		if (this.dataService.userIsAdmin) {
			// Get the uuid of the author from the url
			let authorUuid = this.activatedRoute.snapshot.queryParamMap.get("author");

			// Find the author with the uuid
			let author = this.dataService.adminAuthors.find(a => a.uuid == authorUuid);
			if (!author) {
				this.GoBack();
				return;
			}

			this.author = author;
		} else if (this.dataService.userAuthor) {
			// Get the current author
			this.author = this.dataService.userAuthor;
		} else {
			// Go back, as the user it not an author and not an admin
			this.GoBack();
			return;
		}
		
		// Get the collections
		for (let collection of this.author.collections) {
			// Find the correct name
			let i = FindAppropriateLanguage(this.dataService.locale.slice(0, 2), collection.names);

			// Find a cover
			let cover: boolean = false;
			let coverContent: string = "";
			for (let book of collection.books) {
				if (book.cover) {
					cover = true;
					coverContent = book.coverContent;
					break;
				}
			}

			this.collections.push({
				uuid: collection.uuid,
				name: collection.names[i].name,
				cover,
				coverContent
			})
		}

		this.loadCollectionsPromiseResolve();
		this.noCollections = this.collections.length == 0;

		if (this.dataService.categories.length == 0) {
			// Get the categories
			let getCategoriesResponse: ApiResponse<any> = await this.apiService.GetCategories();

			// Get the names in the appropriate language	
			for (let category of getCategoriesResponse.data.categories) {
				let currentLanguageIndex = FindAppropriateLanguage(this.dataService.locale.slice(0, 2), category.names);
				let currentLanguage = category.names[currentLanguageIndex];

				this.dataService.categories.push({
					key: category.key,
					name: currentLanguage.name,
					language: currentLanguage.language
				});
			}

			this.dataService.categoriesPromiseResolve();
		}
	}

	GoBack(){
		this.routingService.NavigateBack("/author");
	}

	Previous() {
		if (this.noCollections && this.section == 2) {
			// Skip the collections section
			this.NavigateToSection(this.section - 2);
		} else {
			this.NavigateToSection(this.section - 1);
		}
	}

	Next() {
		if (this.noCollections && this.section == 0) {
			// Skip the collections section
			this.NavigateToSection(this.section + 2);
		} else {
			this.NavigateToSection(this.section + 1);
		}
	}

	NavigateToSection(index: number){
		this.forwardNavigation = index > this.section;

		this.section = index;

		setTimeout(() => {
			this.visibleSection = index;
		}, 500);
	}

	//#region Name functions
	async SubmitTitle(){
		if (this.title.length >= 3) {
			// Wait for the collections
			this.loading = true;
			await this.loadCollectionsPromise;
			this.loading = false;

			this.Next();

			this.submittedTitle = this.title;
			this.titleSubmitted = true;
		}
	}
	//#endregion

	//#region Collection functions
	SubmitCollection() {
		if (this.selectedCollection != -2) {
			this.Next();
		}
	}
	//#endregion

	//#region Description + Language functions
	SetLanguage(language: string){
		this.language = language;
	}

	SubmitDescription(){
		// TODO: Update the book with the description and language on the server
		this.Next();
	}
	//#endregion

	//#region Categories functions
	CategoryCheckboxSelected(event: {checked: boolean}, key: string) {
		if (event.checked) {
			// Add the category to the selected categories
			this.selectedCategories.push(key);
		} else {
			// Remove the category from the selected categories
			let i = this.selectedCategories.indexOf(key);
			if (i != -1) this.selectedCategories.splice(i, 1);
		}
	}

	SubmitCategories() {
		if (this.selectedCategories.length > 0) {
			this.Next();
		}
	}
	//#endregion

	//#region Price functions
	SetPrice(price: number) {
		this.price = price;

		// TODO: Update the price on the server + error handling


		this.editPriceComponent.SetPrice(price);
	}

	SubmitPrice() {
		this.Next();
	}
	//#endregion

	//#region Cover functions
	async CoverUpload(file: ReadFile) {
		this.coverContentBase64 = file.content;
		this.coverType = file.type;

		// Read the content of the image file
		this.coverContent = await new Promise(resolve => {
			let reader = new FileReader();
			reader.addEventListener('loadend', () => {
				resolve(reader.result as ArrayBuffer);
			});
			reader.readAsArrayBuffer(new Blob([file.underlyingFile]));
		});
	}

	SubmitCover() {
		this.Next();
	}
	//#endregion

	//#region Book file
	async BookFileUpload(file: ReadFile) {
		this.bookFileName = file.name;
		this.bookFileType = file.type;

		// Read the content of the book file
		this.bookFileContent = await new Promise(resolve => {
			let reader = new FileReader();
			reader.addEventListener('loadend', () => {
				resolve(reader.result as ArrayBuffer);
			});
			reader.readAsArrayBuffer(new Blob([file.underlyingFile]));
		});
	}
	//#endregion

	async Finish() {
		this.loading = true;
		let collectionUuid = "";

		if (this.noCollections || this.selectedCollection == -1) {
			// Create the collection with the given name and the selected language
			let createCollectionResponse = await this.apiService.CreateStoreBookCollection({
				jwt: this.dataService.user.JWT,
				author: this.dataService.userIsAdmin ? this.author.uuid : null,
				name: this.title,
				language: this.language
			})

			if (createCollectionResponse.status != 201) {
				// TODO: Show error
				this.loading = false;
				return;
			}

			collectionUuid = createCollectionResponse.data.uuid;
		} else {
			collectionUuid = this.collections[this.selectedCollection].uuid;
		}

		// Create the store book with collection, title and language
		let createStoreBookResponse = await this.apiService.CreateStoreBook({
			jwt: this.dataService.user.JWT,
			collection: collectionUuid,
			title: this.title,
			language: this.language
		})

		if (createStoreBookResponse.status != 201) {
			// TODO: Show error
			this.loading = false;
			return;
		}

		if (this.coverContent) {
			// Upload the cover
			await this.apiService.SetStoreBookCover({
				jwt: this.dataService.user.JWT,
				uuid: createStoreBookResponse.data.uuid,
				type: this.coverType,
				file: this.coverContent
			})
		}

		if (this.bookFileContent) {
			// Upload the book file
			await this.apiService.SetStoreBookFile({
				jwt: this.dataService.user.JWT,
				uuid: createStoreBookResponse.data.uuid,
				type: this.bookFileType,
				file: this.bookFileContent
			})
		}

		// Redirect to the AuthorBookPage
		this.router.navigate(["author", "book", createStoreBookResponse.data.uuid]);
	}

	RandomInteger(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
}