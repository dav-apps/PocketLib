import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService, ApiResponse, Category, GetStoreBookCoverLink } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
import { environment } from 'src/environments/environment';

@Component({
	selector: 'store-books-page',
	templateUrl: './store-books-page.component.html'
})
export class StoreBooksPageComponent{
	category: Category = {key: "", name: "", language: ""};
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
			let key = this.activatedRoute.snapshot.paramMap.get('key');
			await this.UpdateView(key);
		});
	}

	async UpdateView(key: string){
		// Get the selected category
		await this.dataService.categoriesPromise;
		this.category = this.dataService.categories.find(c => c.key == key);

		// Get the books of the category
		this.books = [];
		let getStoreBooksByCategoryResponse: ApiResponse = await this.websocketService.Emit(WebsocketCallbackType.GetStoreBooksByCategory, {key, language: this.dataService.locale.slice(0, 2)});

		for(let storeBook of getStoreBooksByCategoryResponse.data.books){
			this.books.push({
				uuid: storeBook.uuid,
				title: storeBook.title,
				cover: storeBook.cover,
				coverContent: GetStoreBookCoverLink(storeBook.uuid)
			});
		}
	}

	NavigateToStoreBook(uuid: string){
		this.router.navigate(["store", "book", uuid]);
	}
}