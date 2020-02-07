import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IIconStyles } from 'office-ui-fabric-react';
import { DataService, ApiResponse, BookStatus, GetBookStatusByString, GetContentAsInlineSource } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-store-book-page',
	templateUrl: './store-book-page.component.html'
})
export class StoreBookPageComponent{
	locale = enUS.storeBookPage;
	getStoreBookSubscriptionKey: number;
	getStoreBookCoverSubscriptionKey: number;

	uuid: string;
	book: {collection: string, title: string, description: string, status: BookStatus} = {collection: "", title: "", description: "", status: BookStatus.Unpublished}
	coverContent: string = this.dataService.darkTheme ? '/assets/images/placeholder-dark.png' : '/assets/images/placeholder.png';

	backButtonIconStyles: IIconStyles = {
		root: {
         fontSize: 18
		}
	}

	constructor(
		private dataService: DataService,
		private websocketService: WebsocketService,
		private activatedRoute: ActivatedRoute
	){
		this.locale = this.dataService.GetLocale().storeBookPage;
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
		this.websocketService.Unsubscribe(this.getStoreBookSubscriptionKey);
	}

	GetStoreBookResponse(response: ApiResponse){
		if(response.status == 200){
			this.book.collection = response.data.collection;
			this.book.title = response.data.title;
			this.book.description = response.data.description;
			this.book.status = GetBookStatusByString(response.data.status);
		}
	}

	GetStoreBookCoverResponse(response: ApiResponse){
		if(response.status == 200){
			this.coverContent = GetContentAsInlineSource(response.data, response.headers['content-type']);
		}
	}
}