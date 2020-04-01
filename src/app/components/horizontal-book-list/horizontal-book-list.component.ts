import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiResponse } from 'dav-npm';
import { DataService, GetStoreBookCoverLink } from 'src/app/services/data-service';
import { ApiService } from 'src/app/services/api-service';
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
		private apiService: ApiService,
		private router: Router
	){
		this.locale = this.dataService.GetLocale().horizontalBookList;
	}

	async ngOnInit(){
		// Get the latest store books
		this.books = [];
		let response: ApiResponse<any> = await this.apiService.GetLatestStoreBooks({language: this.dataService.locale.slice(0, 2)});
		if(response.status != 200) return;
		
		for(let storeBook of response.data.books){
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