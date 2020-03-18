import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IIconStyles, IButtonStyles, IDialogContentProps } from 'office-ui-fabric-react';
import {
	DataService,
	ApiResponse,
	BookStatus,
	GetBookStatusByString,
	DownloadStoreBookCoverAsBase64,
	DownloadProfileImageOfAuthorAsBase64,
	Author
} from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
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
	coverContent: string = this.dataService.darkTheme ? '/assets/images/placeholder-dark.png' : '/assets/images/placeholder.png';
	authorProfileImageContent: string = "https://davapps.blob.core.windows.net/avatars-dev/default.png";
	addToLibraryButtonDisabled: boolean = false;
	davPlusRequiredDialogVisible: boolean = false;

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
		private snackBar: MatSnackBar,
		private router: Router,
		private activatedRoute: ActivatedRoute
	){
		this.locale = this.dataService.GetLocale().storeBookPage;

		// Get the uuid from the params
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid');
	}

	async ngOnInit(){
		await this.dataService.userPromise;

		// Get the store book
		this.GetStoreBookResponse(
			await this.websocketService.Emit(WebsocketCallbackType.GetStoreBook, {
				jwt: this.dataService.user.JWT,
				uuid: this.uuid
			})
		)

		// Get the store book cover
		this.coverContent = await DownloadStoreBookCoverAsBase64(this.uuid, this.dataService.user.JWT);
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

			// Get the profile image of the author
			this.authorProfileImageContent = await DownloadProfileImageOfAuthorAsBase64(this.author.uuid, this.dataService.user.JWT);
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