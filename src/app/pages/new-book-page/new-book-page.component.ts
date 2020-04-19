import { Component, ViewChild, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IIconStyles, SpinnerSize, IButtonStyles, IDialogContentProps } from 'office-ui-fabric-react';
import { ReadFile } from 'ngx-file-helpers';
import {
	DataService,
	Author,
	FindAppropriateLanguage
} from 'src/app/services/data-service';
import { ApiService } from 'src/app/services/api-service';
import { RoutingService } from 'src/app/services/routing-service';
import { CategoriesSelectionComponent } from 'src/app/components/categories-selection/categories-selection.component';
import { EditPriceComponent } from 'src/app/components/edit-price/edit-price.component';

@Component({
	selector: 'pocketlib-new-book-page',
	templateUrl: './new-book-page.component.html'
})
export class NewBookPageComponent{
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

	//#region General variables
	author: Author = {
		uuid: "",
		firstName: "",
		lastName: "",
		bios: [],
		collections: [],
		profileImage: false
	}
	goBackDialogVisible: boolean = false;

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
	goBackDialogContentProps: IDialogContentProps = {
		title: "Seite verlassen"
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
	collectionSelected: boolean = false;
	loadCollectionsPromise: Promise<null> = new Promise(resolve => this.loadCollectionsPromiseResolve = resolve);
	loadCollectionsPromiseResolve: Function;
	noCollections: boolean = false;
	//#endregion

	//#region Description + Language variables
	description: string = "";
	language: string = this.dataService.locale.startsWith("de") ? "de" : "en";
	//#endregion

	//#region Categories variables
	@ViewChild('categoriesSelection', { static: false }) categoriesSelectionComponent: CategoriesSelectionComponent;
	selectedCategories: string[] = [];
	//#endregion

	//#region Price variables
	@ViewChild('editPrice', { static: false }) editPriceComponent: EditPriceComponent;
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

	//#region Loading Screen variables
	height: number = 400;
	loadingScreenVisible: boolean = false;
	loadingScreenMessage: string = "";
	//#endregion

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
		this.setSize();
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

		// If the user navigated from the collection view, preselect the appropriate collection
		let collectionUuid = this.activatedRoute.snapshot.queryParamMap.get("collection");
		if (collectionUuid) {
			let i = this.collections.findIndex(c => c.uuid == collectionUuid);
			if (i != -1) this.selectedCollection = i;
		}

		this.loadCollectionsPromiseResolve();
		this.noCollections = this.collections.length == 0;
	}

	@HostListener('window:resize')
	setSize(){
		this.height = window.innerHeight;
	}

	@HostListener('window:beforeunload', ['$event'])
	ShowAlert(event: any) {
		event.returnValue = true;
	}
	
	ShowGoBackDialog() {
		this.goBackDialogVisible = true;
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
	SelectCollection(index: number) {
		this.selectedCollection = index;

		if (!this.collectionSelected) {
			this.collectionSelected = true;
			this.Next();
		}
	}

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
		this.Next();
	}
	//#endregion

	//#region Categories functions
	SubmitCategories() {
		this.selectedCategories = this.categoriesSelectionComponent.GetSelectedCategories();
		this.Next();
	}
	//#endregion

	//#region Price functions
	SetPrice(price: number) {
		// TODO: Check if the price is valid
		this.price = price;
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

	//#region Book file functions
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

	//#region Loading Screen functions
	ShowLoadingScreen() {
		this.dataService.navbarVisible = false;
		this.loadingScreenVisible = true;

		setTimeout(() => {
			// Set the color of the progress ring
			let progress = document.getElementsByTagName('circle');
			if(progress.length > 0){
				let item = progress.item(0);
				item.setAttribute('style', item.getAttribute('style') + ' stroke: white');
			}
		}, 1);
	}

	async Finish() {
		this.ShowLoadingScreen();
		let collectionUuid = "";

		this.loadingScreenMessage = "Buch wird erstellt...";

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

			// Check if the selected collection has already a name in the given language
			let originalCollection = this.author.collections.find(c => c.uuid = collectionUuid);
			
			let nameIndex = originalCollection.names.findIndex(name => name.language == this.language);

			if (nameIndex == -1) {
				// Add the new name to the collection
				await this.apiService.SetStoreBookCollectionName({
					jwt: this.dataService.user.JWT,
					uuid: collectionUuid,
					language: this.language,
					name: this.title
				})
			}
		}

		// Create the store book with collection, title and language
		let createStoreBookResponse = await this.apiService.CreateStoreBook({
			jwt: this.dataService.user.JWT,
			collection: collectionUuid,
			description: this.description,
			title: this.title,
			language: this.language,
			price: this.price,
			categories: this.selectedCategories
		})

		if (createStoreBookResponse.status != 201) {
			// TODO: Show error
			this.loading = false;
			return;
		}

		if (this.coverContent) {
			this.loadingScreenMessage = "Cover wird hochgeladen...";

			// Upload the cover
			await this.apiService.SetStoreBookCover({
				jwt: this.dataService.user.JWT,
				uuid: createStoreBookResponse.data.uuid,
				type: this.coverType,
				file: this.coverContent
			})
		}

		if (this.bookFileContent) {
			this.loadingScreenMessage = "Buch-Datei wird hochgeladen...";

			// Upload the book file
			await this.apiService.SetStoreBookFile({
				jwt: this.dataService.user.JWT,
				uuid: createStoreBookResponse.data.uuid,
				type: this.bookFileType,
				file: this.bookFileContent
			})
		}

		// Reload the author of the user
		this.loadingScreenMessage = "Lokale Daten werden aktualisiert...";
		await this.dataService.LoadAuthorOfUser();

		// Redirect to the AuthorBookPage
		this.dataService.navbarVisible = true;
		this.router.navigate(["author", "book", createStoreBookResponse.data.uuid]);
	}
	//#endregion

	RandomInteger(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
}