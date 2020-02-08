import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IIconStyles } from 'office-ui-fabric-react';
import { DataService, ApiResponse, BookStatus, GetBookStatusByString, GetContentAsInlineSource, Author } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-store-book-page',
	templateUrl: './store-book-page.component.html'
})
export class StoreBookPageComponent{
	locale = enUS.storeBookPage;
	getAuthorSubscriptionKey: number;
	getProfileImageOfAuthorSubscriptionKey: number;
	getStoreBookCollectionSubscriptionKey: number;
	getStoreBookSubscriptionKey: number;
	getStoreBookCoverSubscriptionKey: number;

	uuid: string;
	book: {collection: string, title: string, description: string, status: BookStatus} = {collection: "", title: "", description: "", status: BookStatus.Unpublished};
	author: Author = {uuid: "", firstName: "", lastName: "", bios: [], collections: [], profileImage: false};
	coverContent: string = this.dataService.darkTheme ? '/assets/images/placeholder-dark.png' : '/assets/images/placeholder.png';
	authorProfileImageContent: string = "https://davapps.blob.core.windows.net/avatars-dev/default.png";

	backButtonIconStyles: IIconStyles = {
		root: {
         fontSize: 18
		}
	}

	constructor(
		private dataService: DataService,
		private websocketService: WebsocketService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	){
		this.locale = this.dataService.GetLocale().storeBookPage;
		this.getAuthorSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.GetAuthor, (response: ApiResponse) => this.GetAuthorResponse(response));
		this.getProfileImageOfAuthorSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.GetProfileImageOfAuthor, (response: ApiResponse) => this.GetProfileImageOfAuthorResponse(response));
		this.getStoreBookCollectionSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.GetStoreBookCollection, (response: ApiResponse) => this.GetStoreBookCollectionResponse(response));
		this.getStoreBookSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.GetStoreBook, (response: ApiResponse) => this.GetStoreBookResponse(response));
		this.getStoreBookCoverSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.GetStoreBookCover, (response: ApiResponse) => this.GetStoreBookCoverResponse(response));

		// Get the uuid from the params
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid');
	}

	async ngOnInit(){
		await this.dataService.userPromise;

		// Get the store book
		this.websocketService.Emit(WebsocketCallbackType.GetStoreBook, {
			jwt: this.dataService.user.JWT,
			uuid: this.uuid
		});

		// Get the store book cover
		this.websocketService.Emit(WebsocketCallbackType.GetStoreBookCover, {
			jwt: this.dataService.user.JWT,
			uuid: this.uuid
		});
	}

	ngOnDestroy(){
		this.websocketService.Unsubscribe(
			this.getAuthorSubscriptionKey,
			this.getProfileImageOfAuthorSubscriptionKey,
			this.getStoreBookCollectionSubscriptionKey,
			this.getStoreBookSubscriptionKey,
			this.getStoreBookCoverSubscriptionKey
		)
	}

	NavigateToAuthor(){
		this.router.navigate(['store', 'author', this.author.uuid]);
	}

	GetAuthorResponse(response: ApiResponse){
		if(response.status == 200){
			this.author.uuid = response.data.uuid;
			this.author.firstName = response.data.first_name;
			this.author.lastName = response.data.last_name;
			this.author.bios = response.data.bios;
			this.author.collections = response.data.collections;
			this.author.profileImage = response.data.profile_image;

			// Get the profile image of the author
			this.websocketService.Emit(WebsocketCallbackType.GetProfileImageOfAuthor, {
				jwt: this.dataService.user.JWT,
				uuid: this.author.uuid
			});
		}
	}

	GetProfileImageOfAuthorResponse(response: ApiResponse){
		if(response.status == 200){
			this.authorProfileImageContent = GetContentAsInlineSource(response.data, response.headers['content-type']);
		}
	}

	GetStoreBookCollectionResponse(response: ApiResponse){
		if(response.status == 200){
			// Get the author
			this.websocketService.Emit(WebsocketCallbackType.GetAuthor, {
				jwt: this.dataService.user.JWT,
				uuid: response.data.author
			});
		}
	}

	GetStoreBookResponse(response: ApiResponse){
		if(response.status == 200){
			this.book.collection = response.data.collection;
			this.book.title = response.data.title;
			this.book.description = response.data.description;
			this.book.status = GetBookStatusByString(response.data.status);

			// Get the collection
			this.websocketService.Emit(WebsocketCallbackType.GetStoreBookCollection, {
				jwt: this.dataService.user.JWT,
				uuid: response.data.collection
			});
		}
	}

	GetStoreBookCoverResponse(response: ApiResponse){
		if(response.status == 200){
			this.coverContent = GetContentAsInlineSource(response.data, response.headers['content-type']);
		}
	}
}