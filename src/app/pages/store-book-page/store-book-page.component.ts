import { Component, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IButtonStyles, IDialogContentProps } from 'office-ui-fabric-react';
import {
	CreatePurchase,
	ApiResponse,
	ApiErrorResponse,
	PurchaseResponseData,
	DownloadTableObject
} from 'dav-npm';
import {
	DataService,
	BookStatus,
	GetBookStatusByString,
	GetAuthorProfileImageLink,
	GetStoreBookCoverLink,
	Author
} from 'src/app/services/data-service';
import { ApiService } from 'src/app/services/api-service';
import { RoutingService } from 'src/app/services/routing-service';
import { environment } from 'src/environments/environment';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-store-book-page',
	templateUrl: './store-book-page.component.html'
})
export class StoreBookPageComponent{
	locale = enUS.storeBookPage;
	uuid: string;
	book: {
		collection: string,
		title: string,
		description: string,
		price: number,
		status: BookStatus,
		categories: {
			key: string,
			name: string
		}[],
		inLibrary: boolean,
		purchased: boolean
	} = {
		collection: "",
		title: "",
		description: "",
		price: 0,
		status: BookStatus.Unpublished,
		categories: [],
		inLibrary: false,
		purchased: false
	}
	price: string = "";
	bookStatus: string = "";
	author: Author = {uuid: "", firstName: "", lastName: "", bios: [], collections: [], profileImage: false};
	coverContent: string;
	authorProfileImageContent: string = this.dataService.defaultAvatar;
	showMobileLayout: boolean = false;
	addToLibraryButtonDisabled: boolean = false;
	davProRequiredDialogVisible: boolean = false;
	buyBookDialogVisible: boolean = false;
	buyBookDialogLoginRequired: boolean = false;
	errorDialogVisible: boolean = false;

	dialogPrimaryButtonStyles: IButtonStyles = {
		root: {
			marginLeft: 10
		}
	}
	davProRequiredDialogContentProps: IDialogContentProps = {
		title: this.locale.davProRequiredDialog.title
	}
	buyBookDialogContentProps: IDialogContentProps = {
		title: this.locale.buyBookDialog.title
	}
	errorDialogContentProps: IDialogContentProps = {
		title: this.locale.errorDialog.title
	}

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private routingService: RoutingService,
		private snackBar: MatSnackBar,
		private router: Router,
		private activatedRoute: ActivatedRoute
	){
		this.locale = this.dataService.GetLocale().storeBookPage;

		// Get the uuid from the params
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid');
	}

	async ngOnInit(){
		this.setSize();
		await this.dataService.userPromiseHolder.AwaitResult();

		// Get the store book cover
		this.coverContent = GetStoreBookCoverLink(this.uuid);

		// Get StoreBook, StoreBookCollection and Author
		await this.GetData();
	}

	@HostListener('window:resize')
	onResize(){
		this.setSize();
	}

	setSize(){
		this.showMobileLayout = window.outerWidth < 768;
	}

	GoBack(){
		this.routingService.NavigateBack("/store");
	}

	NavigateToAuthor(){
		this.router.navigate(['store', 'author', this.author.uuid]);
	}

	ShowErrorDialog() {
		this.errorDialogContentProps.title = this.locale.errorDialog.title;
		this.errorDialogVisible = true;
	}

	async GetData(){
		// Get the StoreBook
		let collectionUuid = await this.GetStoreBook();
		if(!collectionUuid) return;

		// Get the StoreBookCollection
		let authorUuid = await this.GetStoreBookCollection(collectionUuid);
		if(!authorUuid) return;

		// Get the Author
		await this.GetAuthor(authorUuid);
	}

	async GetStoreBook() : Promise<string>{
		let response: ApiResponse<any> = await this.apiService.GetStoreBook({
			jwt: this.dataService.user.JWT,
			uuid: this.uuid
		})

		if(response.status == 200){
			this.book.collection = response.data.collection;
			this.book.title = response.data.title;
			this.book.description = response.data.description;
			this.book.price = response.data.price;
			this.book.status = GetBookStatusByString(response.data.status);
			this.book.inLibrary = response.data.in_library;
			this.book.purchased = response.data.purchased;

			this.addToLibraryButtonDisabled = this.book.inLibrary;

			// Load the price
			if(this.book.price == 0){
				this.price = this.locale.free;
			}else{
				this.price = (this.book.price / 100).toFixed(2) + " €";

				if(this.dataService.locale.slice(0, 2) == "de"){
					this.price = this.price.replace('.', ',');
				}
			}
			
			// Load the status
			switch(this.book.status){
				case BookStatus.Unpublished:
					this.bookStatus = this.locale.unpublished;
					break;
				case BookStatus.Review:
					this.bookStatus = this.locale.review;
					break;
				case BookStatus.Hidden:
					this.bookStatus = this.locale.hidden;
					break;
			}

			// Load the categories
			await this.dataService.categoriesPromiseHolder.AwaitResult();
			for (let key of response.data.categories) {
				// Find the category with the key
				let category = this.dataService.categories.find(c => c.key == key);

				if (category) {
					this.book.categories.push({
						key: category.key,
						name: category.name
					})
				}
			}

			return response.data.collection;
		}

		return null;
	}

	async GetStoreBookCollection(uuid: string) : Promise<string>{
		let response: ApiResponse<any> = await this.apiService.GetStoreBookCollection({
			jwt: this.dataService.user.JWT,
			uuid
		})

		if(response.status == 200){
			return response.data.author;
		}

		return null;
	}

	async GetAuthor(uuid: string){
		let response: ApiResponse<any> = await this.apiService.GetAuthor({uuid});

		if(response.status == 200){
			this.author.uuid = response.data.uuid;
			this.author.firstName = response.data.first_name;
			this.author.lastName = response.data.last_name;
			this.author.bios = response.data.bios;
			this.author.collections = response.data.collections;
			this.author.profileImage = response.data.profile_image;
			this.authorProfileImageContent = response.data.profile_image ? GetAuthorProfileImageLink(this.author.uuid) : this.dataService.defaultAvatar;
		}
	}

	async AddToLibrary(){
		// Check if the user can add the book to the library
		let isAuthorOfBook = false;
		if(this.dataService.userAuthor){
			// Try to find the book in the books of the author
			isAuthorOfBook = this.dataService.userAuthor.collections.findIndex(collection => collection.uuid == this.book.collection) != -1;
		}

		if(
			!this.dataService.userIsAdmin && 
			!isAuthorOfBook &&
			this.dataService.user.Plan != 2
		){
			// Show dav Pro dialog
			this.davProRequiredDialogContentProps.title = this.locale.davProRequiredDialog.title;
			this.davProRequiredDialogVisible = true;
			return;
		}

		// Add the StoreBook to the library of the user
		let response: ApiResponse<any> = await this.apiService.CreateBook({
			jwt: this.dataService.user.JWT,
			storeBook: this.uuid
		})

		if (response.status == 201) {
			this.addToLibraryButtonDisabled = true;

			// Show Snackbar
			this.snackBar.open(this.locale.snackbarMessageAdded, null, { duration: 5000 });
			
			// Download the table objects
			await DownloadTableObject(response.data.uuid);
			await DownloadTableObject(response.data.file);
		} else {
			// Show error
			this.ShowErrorDialog();
		}
	}

	async BuyBook() {
		if (this.dataService.user.IsLoggedIn) {
			if(this.book.price == 0){
				// Purchase this book directly
				let createPurchaseResponse: ApiResponse<PurchaseResponseData> | ApiErrorResponse = await CreatePurchase(
					this.dataService.user.JWT,
					this.uuid,
					this.coverContent,
					this.book.title,
					this.authorProfileImageContent,
					`${this.author.firstName} ${this.author.lastName}`,
					this.book.price,
					"eur"
				)
	
				if(createPurchaseResponse.status == 201){
					this.book.purchased = true;
				}else{
					// Show error
					this.ShowErrorDialog();
				}
			}else{
				// Show dialog for buying the book
				this.ShowBuyBookDialog(false);
			}
		} else {
			// Show the Buy book dialog with login required
			this.ShowBuyBookDialog(true);
		}
	}

	ShowBuyBookDialog(loginRequired: boolean){
		this.buyBookDialogContentProps.title = this.book.price == 0 ? this.locale.buyBookDialog.loginRequired.titleFree : this.locale.buyBookDialog.title;
		this.buyBookDialogLoginRequired = loginRequired;
		this.buyBookDialogVisible = true;
	}

	NavigateToAccountPage(){
		this.router.navigate(['account']);
	}

	NavigateToCategory(key: string) {
		this.router.navigate(["store", "books", key]);
	}

	async NavigateToPurchasePage(){
		// Create the purchase on the server
		let createPurchaseResponse: ApiResponse<PurchaseResponseData> | ApiErrorResponse = await CreatePurchase(
			this.dataService.user.JWT,
			this.uuid,
			this.coverContent,
			this.book.title,
			this.authorProfileImageContent,
			`${this.author.firstName} ${this.author.lastName}`,
			this.book.price,
			"eur"
		)
		this.buyBookDialogVisible = false;

		if(createPurchaseResponse.status == 201){
			// Navigate to the purchase page on the website
			let url = environment.baseUrl + this.router.url;
			let purchaseId = (createPurchaseResponse as ApiResponse<PurchaseResponseData>).data.id;
			
			window.location.href = `${environment.websiteBaseUrl}/purchase/${purchaseId}?redirect_url=${url}`;
		}else{
			// Show error
			this.ShowErrorDialog();
		}
	}

	async PublishStoreBook(){
		let response: ApiResponse<any> = await this.apiService.UpdateStoreBook({
			jwt: this.dataService.user.JWT,
			uuid: this.uuid,
			status: "published"
		})
		if(response.status == 200) this.book.status = BookStatus.Published;
	}
}