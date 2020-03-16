import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DataService, DownloadStoreBookCoverAsBase64 } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-horizontal-book-list',
	templateUrl: './horizontal-book-list.component.html'
})
export class HorizontalBookListComponent{
	locale = enUS.horizontalBookList;
	books: {
		uuid: string,
		title: string,
		cover: boolean,
		coverContent: string
	}[] = [];
	hoveredBookIndex: number = -1;
	
	constructor(
		public dataService: DataService,
		private websocketService: WebsocketService,
		private router: Router
	){
		this.locale = this.dataService.GetLocale().horizontalBookList;
	}

	async ngOnInit(){
		// Get the latest store books
		this.books = [];
		let response = await this.websocketService.Emit(WebsocketCallbackType.GetLatestStoreBooks, {language: this.dataService.locale.slice(0, 2)});
		if(response.status != 200) return;
		
		for(let storeBook of response.data.books){
			let book = {
				uuid: storeBook.uuid,
				title: storeBook.title,
				cover: storeBook.cover,
				coverContent: null
			}
			this.books.push(book);
		}

		// Download the covers
		for(let book of this.books){
			if(!book.cover) continue;
			book.coverContent = await DownloadStoreBookCoverAsBase64(book.uuid, this.dataService.user.JWT);
		}
	}

	NavigateToStoreBook(uuid: string){
		this.router.navigate(["store", "book", uuid]);
	}
}