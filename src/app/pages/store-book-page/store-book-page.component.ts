import { Component, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IIconStyles, IButtonStyles, IDialogContentProps } from 'office-ui-fabric-react';
import { CreatePurchase, ApiResponse, ApiErrorResponse, PurchaseResponseData } from 'dav-npm';
import {
	DataService,
	BookStatus,
	GetBookStatusByString,
	GetAuthorProfileImageLink,
	GetStoreBookCoverLink,
	Author
} from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
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
		inLibrary: boolean,
		purchased: boolean
	} = {collection: "", title: "", description: "", price: 0, status: BookStatus.Unpublished, inLibrary: false, purchased: false};
	price: string = "";
	bookStatus: string = "";
	author: Author = {uuid: "", firstName: "", lastName: "", bios: [], collections: [], profileImage: false};
	coverContent: string;
	authorProfileImageContent: string = this.dataService.defaultAvatar;
	addToLibraryButtonDisabled: boolean = false;
	davProRequiredDialogVisible: boolean = false;
	showMobileLayout: boolean = false;
	buyBookDialogVisible: boolean = false;

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
	davProRequiredDialogContentProps: IDialogContentProps = {
		title: this.locale.davProRequiredDialog.title
	}
	buyBookDialogContentProps: IDialogContentProps = {
		title: this.locale.buyBookDialog.title
	}

	constructor(
		public dataService: DataService,
		private websocketService: WebsocketService,
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
		await this.dataService.userPromise;

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
		let response: ApiResponse<any> = await this.websocketService.Emit(WebsocketCallbackType.GetStoreBook, {
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

			if(this.book.price == 0){
				this.price = this.locale.free;
			}else{
				this.price = (this.book.price / 100).toFixed(2) + " €";

				if(this.dataService.locale.slice(0, 2) == "de"){
					this.price = this.price.replace('.', ',');
				}
			}
			
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

			return response.data.collection;
		}

		return null;
	}

	async GetStoreBookCollection(uuid: string) : Promise<string>{
		let response: ApiResponse<any> = await this.websocketService.Emit(WebsocketCallbackType.GetStoreBookCollection, {
			jwt: this.dataService.user.JWT,
			uuid
		})

		if(response.status == 200){
			return response.data.author;
		}

		return null;
	}

	async GetAuthor(uuid: string){
		let response: ApiResponse<any> = await this.websocketService.Emit(WebsocketCallbackType.GetAuthor, {
			jwt: this.dataService.user.JWT,
			uuid
		})

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
		let response: ApiResponse<any> = await this.websocketService.Emit(WebsocketCallbackType.CreateBook, {
			jwt: this.dataService.user.JWT,
			storeBook: this.uuid
		});

		if(response.status == 201){
			this.addToLibraryButtonDisabled = true;

			// Show Snackbar
			this.snackBar.open(this.locale.snackbarMessageAdded, null, {duration: 5000});
		}
	}

	ShowBuyBookDialog(){
		this.buyBookDialogContentProps.title = this.locale.buyBookDialog.title;
		this.buyBookDialogVisible = true;
	}

	NavigateToAccountPage(){
		this.router.navigate(['account']);
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

		if(createPurchaseResponse.status == 201){
			// Navigate to the purchase page on the website
			let url = environment.baseUrl + this.router.url;
			let purchaseId = (createPurchaseResponse as ApiResponse<PurchaseResponseData>).data.id;
			
			window.location.href = `${environment.websiteBaseUrl}/purchase/${purchaseId}?redirect_url=${url}`;
		}
	}

	async PublishStoreBook(){
		let response: ApiResponse<any> = await this.websocketService.Emit(WebsocketCallbackType.UpdateStoreBook, {jwt: this.dataService.user.JWT, uuid: this.uuid, status: "published"});
		if(response.status == 200) this.book.status = BookStatus.Published;
	}
}