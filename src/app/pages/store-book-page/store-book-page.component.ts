import { Component, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IIconStyles, IButtonStyles, IDialogContentProps } from 'office-ui-fabric-react';
import {
	DataService,
	ApiResponse,
	BookStatus,
	GetBookStatusByString,
	GetAuthorProfileImageLink,
	GetStoreBookCoverLink,
	Author
} from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
import { RoutingService } from 'src/app/services/routing-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-store-book-page',
	templateUrl: './store-book-page.component.html'
})
export class StoreBookPageComponent{
	locale = enUS.storeBookPage;
	uuid: string;
	book: {collection: string, title: string, description: string, status: BookStatus, inLibrary: boolean} = {collection: "", title: "", description: "", status: BookStatus.Unpublished, inLibrary: false};
	bookStatus: string = "";
	author: Author = {uuid: "", firstName: "", lastName: "", bios: [], collections: [], profileImage: false};
	coverContent: string;
	authorProfileImageContent: string = this.dataService.defaultAvatar;
	addToLibraryButtonDisabled: boolean = false;
	davPlusRequiredDialogVisible: boolean = false;
	showMobileLayout: boolean = false;

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
	davPlusRequiredDialogContentProps: IDialogContentProps = {
		title: this.locale.davProRequiredDialog.title
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

		// Get the store book
		this.GetStoreBookResponse(
			await this.websocketService.Emit(WebsocketCallbackType.GetStoreBook, {
				jwt: this.dataService.user.JWT,
				uuid: this.uuid
			})
		)

		// Get the store book cover
		this.coverContent = GetStoreBookCoverLink(this.uuid);
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
			this.davPlusRequiredDialogContentProps.title = this.locale.davProRequiredDialog.title;
			this.davPlusRequiredDialogVisible = true;
			return;
		}

		// Add the StoreBook to the library of the user
		let response: ApiResponse = await this.websocketService.Emit(WebsocketCallbackType.CreateBook, {
			jwt: this.dataService.user.JWT,
			storeBook: this.uuid
		});

		if(response.status == 201){
			this.addToLibraryButtonDisabled = true;

			// Show Snackbar
			this.snackBar.open(this.locale.snackbarMessageAdded, null, {duration: 5000});
		}
	}

	NavigateToAccountPage(){
		this.router.navigate(['account']);
	}

	async PublishStoreBook(){
		let response = await this.websocketService.Emit(WebsocketCallbackType.UpdateStoreBook, {jwt: this.dataService.user.JWT, uuid: this.uuid, status: "published"});
		if(response.status == 200) this.book.status = BookStatus.Published;
	}

	async GetAuthorResponse(response: ApiResponse){
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

	async GetStoreBookCollectionResponse(response: ApiResponse){
		if(response.status == 200){
			// Get the author
			this.GetAuthorResponse(
				await this.websocketService.Emit(WebsocketCallbackType.GetAuthor, {
					jwt: this.dataService.user.JWT,
					uuid: response.data.author
				})
			)
		}
	}

	async GetStoreBookResponse(response: ApiResponse){
		if(response.status == 200){
			this.book.collection = response.data.collection;
			this.book.title = response.data.title;
			this.book.description = response.data.description;
			this.book.status = GetBookStatusByString(response.data.status);
			this.book.inLibrary = response.data.in_library;

			this.addToLibraryButtonDisabled = this.book.inLibrary;
			
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

			// Get the collection
			this.GetStoreBookCollectionResponse(
				await this.websocketService.Emit(WebsocketCallbackType.GetStoreBookCollection, {
					jwt: this.dataService.user.JWT,
					uuid: response.data.collection
				})
			)
		}
	}
}