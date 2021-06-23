import { Component } from '@angular/core'
import { ApiResponse } from 'dav-js'
import { DataService } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { BookListItem } from 'src/app/misc/types'
import { enUS } from 'src/locales/locales'

const maxVisibleStoreBooks = 10

@Component({
	selector: 'pocketlib-horizontal-book-list',
	templateUrl: './horizontal-book-list.component.html'
})
export class HorizontalBookListComponent {
	locale = enUS.horizontalBookList
	books: BookListItem[] = []
	showAllHovered: boolean = false

	constructor(
		public dataService: DataService,
		private apiService: ApiService
	) {
		this.locale = this.dataService.GetLocale().horizontalBookList
	}

	async ngOnInit() {
		// Get the latest store books
		this.books = []
		let response = await this.apiService.GetLatestStoreBooks({
			languages: await this.dataService.GetStoreLanguages(),
			limit: maxVisibleStoreBooks
		})
		if (response.status != 200) return

		for (let storeBook of (response as ApiResponse<any>).data.books) {
			let width = 123
			let height = 190

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

			let bookItem: BookListItem = {
				uuid: storeBook.uuid,
				title: storeBook.title,
				cover: storeBook.cover,
				coverContent: null,
				coverBlurhash: storeBook.cover_blurhash,
				coverWidth: width,
				coverHeight: height
			}

			this.apiService.GetStoreBookCover({ uuid: storeBook.uuid }).then((result: ApiResponse<string>) => {
				bookItem.coverContent = result.data
			})

			this.books.push(bookItem)
		}
	}
}