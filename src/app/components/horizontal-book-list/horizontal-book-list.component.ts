import { Component, Input, SimpleChanges } from '@angular/core'
import { ApiResponse } from 'dav-js'
import { DataService } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { BookListItem } from 'src/app/misc/types'
import { enUS } from 'src/locales/locales'

const maxVisibleStoreBooks = 10
type HorizontalBookListType = "latest" | "categories"

@Component({
	selector: 'pocketlib-horizontal-book-list',
	templateUrl: './horizontal-book-list.component.html'
})
export class HorizontalBookListComponent {
	@Input() type: HorizontalBookListType = "latest"
	@Input() currentBookUuid: string = ""
	@Input() categories: string[] = []
	locale = enUS.horizontalBookList
	books: BookListItem[] = []
	showAllHovered: boolean = false
	loading: boolean = true

	constructor(
		public dataService: DataService,
		private apiService: ApiService
	) {
		this.locale = this.dataService.GetLocale().horizontalBookList
	}

	async ngOnInit() {
		if (this.type == "latest") {
			await this.LoadLatestStoreBooks()
		} else if (this.categories.length > 0) {
			await this.LoadStoreBooksByCategories()
		}
	}

	async ngOnChanges(changes: SimpleChanges) {
		if (
			changes.categories == null
			|| changes.categories.currentValue.length == 0
		) return

		await this.LoadStoreBooksByCategories()
	}

	async LoadLatestStoreBooks() {
		// Get the latest store books
		let response = await this.apiService.GetLatestStoreBooks({
			languages: await this.dataService.GetStoreLanguages(),
			limit: maxVisibleStoreBooks
		})

		if (response.status != 200) return
		this.ShowBooks((response as ApiResponse<any>).data.books)
	}

	async LoadStoreBooksByCategories() {
		// Get the store books with the given categories
		let response = await this.apiService.GetStoreBooksByCategory({
			keys: this.categories,
			languages: await this.dataService.GetStoreLanguages()
		})

		if (response.status != 200) return

		let books = []
		for (let book of (response as ApiResponse<any>).data.books) {
			books.push(book)
		}

		// Remove the current book
		let i = books.findIndex(book => book.uuid == this.currentBookUuid)
		if (i != -1) books.splice(i, 1)

		this.ShowBooks(books)
	}

	ShowBooks(books: any[]) {
		this.books = []

		for (let storeBook of books) {
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

		this.loading = false
	}
}