import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService, ApiResponse, DownloadStoreBookCoverAsBase64 } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';

@Component({
	selector: 'store-books-page',
	templateUrl: './store-books-page.component.html'
})
export class StoreBooksPageComponent{
	key: string;
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
		private router: Router,
		private activatedRoute: ActivatedRoute
	){
		this.activatedRoute.url.subscribe(async () => {
			this.key = this.activatedRoute.snapshot.paramMap.get('key');
			await this.UpdateView();
		});
	}

	async UpdateView(){
		this.books = [];
		let getStoreBooksByCategoryResponse: ApiResponse = await this.websocketService.Emit(WebsocketCallbackType.GetStoreBooksByCategory, {key: this.key});

		for(let storeBook of getStoreBooksByCategoryResponse.data.books){
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