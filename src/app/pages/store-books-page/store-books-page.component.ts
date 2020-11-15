import { Component } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { ApiResponse } from 'dav-npm'
import { DataService, Category, GetStoreBookCoverLink } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'

@Component({
	selector: 'store-books-page',
	templateUrl: './store-books-page.component.html'
})
export class StoreBooksPageComponent{
	category: Category = {key: "", name: "", language: ""}
	books: {
		uuid: string,
		title: string,
		cover: boolean,
		coverContent: string,
		coverBlurhash: string,
		coverWidth: number,
		coverHeight: number
	}[] = []
	hoveredBookIndex: number = -1
	
	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	){
		this.activatedRoute.url.subscribe(async () => {
			let key = this.activatedRoute.snapshot.paramMap.get('key')
			await this.UpdateView(key)
		})
	}

	async UpdateView(key: string){
		// Get the selected category
		await this.dataService.categoriesPromiseHolder.AwaitResult();
		this.category = this.dataService.categories.find(c => c.key == key);

		// Get the books of the category
		this.books = []
		let getStoreBooksByCategoryResponse: ApiResponse<any> = await this.apiService.GetStoreBooksByCategory({
			key,
			languages: await this.dataService.GetStoreLanguages()
		})

		for(let storeBook of getStoreBooksByCategoryResponse.data.books){
			// Calculate the width and height
			let width = 178
			let height = 270

			if (storeBook.cover_aspect_ratio != null) {
				let parts = storeBook.cover_aspect_ratio.split(':')
				let widthAspectRatio = +parts[0]
				let heightAspectRatio = +parts[1]

				if (widthAspectRatio == 1) {
					// 1:2 -> 0.5:1
					widthAspectRatio /= heightAspectRatio
				}

				width = Math.round(height * widthAspectRatio)
			}

			this.books.push({
				uuid: storeBook.uuid,
				title: storeBook.title,
				cover: storeBook.cover,
				coverContent: GetStoreBookCoverLink(storeBook.uuid),
				coverBlurhash: storeBook.cover_blurhash,
				coverWidth: width,
				coverHeight: height
			})
		}
	}

	NavigateToStoreBook(uuid: string){
		this.router.navigate(["store", "book", uuid]);
	}
}