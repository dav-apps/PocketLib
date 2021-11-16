import { Component, Input, SimpleChanges } from '@angular/core'
import { ApiResponse } from 'dav-js'
import { DataService } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { BookListItem } from 'src/app/misc/types'
import { AdaptCoverWidthHeightToAspectRatio } from 'src/app/misc/utils'
import { enUS } from 'src/locales/locales'

const maxVisibleStoreBooks = 10
type HorizontalBookListType = "latest" | "categories" | "series"

@Component({
	selector: 'pocketlib-horizontal-book-list',
	templateUrl: './horizontal-book-list.component.html'
})
export class HorizontalBookListComponent {
	@Input() type: HorizontalBookListType = "latest"
	@Input() currentBookUuid: string = ""
	@Input() categories: string[] = []
	@Input() series: string = ""
	locale = enUS.horizontalBookList
	header: string = ""
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
			this.header = this.locale.recentlyPublished
		} else if (this.type == "categories") {
			this.header = this.categories.length == 1 ? this.locale.moreBooksInCategory : this.locale.moreBooksInCategories
		}

		if (this.type == "latest") {
			await this.LoadLatestStoreBooks()
		} else if (this.type == "categories" && this.categories.length > 0) {
			await this.LoadStoreBooksByCategories()
		} else if (this.type == "series") {
			await this.LoadStoreBooksBySeries()
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

	async LoadStoreBooksBySeries() {
		if (this.series.length == 0) return

		// Get the store book series
		let response = await this.apiService.GetStoreBookSeries({
			uuid: this.series,
			languages: await this.dataService.GetStoreLanguages()
		})

		if (response.status != 200) return

		let responseData = (response as ApiResponse<any>).data

		// Set the header
		this.header = this.locale.moreOfSeries.replace('{0}', responseData.name)

		// Get the books of the series
		let books = []
		for (let book of responseData.books) {
			books.push(book)
		}

		this.ShowBooks(books)
	}

	ShowBooks(books: any[]) {
		this.books = []

		for (let storeBook of books) {
			let height = 190
			let width = AdaptCoverWidthHeightToAspectRatio(123, height, storeBook.cover_aspect_ratio)

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