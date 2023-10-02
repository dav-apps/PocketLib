import { Component, Input, SimpleChanges } from "@angular/core"
import { isSuccessStatusCode } from "dav-js"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import {
	BookListItem,
	ApiResponse,
	StoreBookResource
} from "src/app/misc/types"
import { AdaptCoverWidthHeightToAspectRatio } from "src/app/misc/utils"

const maxVisibleStoreBooks = 7
type HorizontalBookListType = "latest" | "categories" | "series" | "random"

@Component({
	selector: "pocketlib-horizontal-book-list",
	templateUrl: "./horizontal-book-list.component.html",
	styleUrls: ["./horizontal-book-list.component.scss"]
})
export class HorizontalBookListComponent {
	@Input() type: HorizontalBookListType = "latest"
	@Input() headline: string = ""
	@Input() currentBookUuid: string = ""
	@Input() categories: string[] = []
	@Input() series: string = ""
	books: BookListItem[] = []
	loading: boolean = true

	constructor(
		public dataService: DataService,
		private apiService: ApiService
	) {}

	async ngOnInit() {
		if (this.type == "categories" && this.categories.length > 0) {
			await this.LoadStoreBooksByCategories()
		} else if (this.type == "series") {
			await this.LoadStoreBooksBySeries()
		} else if (this.type == "random") {
			await this.LoadStoreBooksRandomly()
		} else {
			await this.LoadLatestStoreBooks()
		}
	}

	async ngOnChanges(changes: SimpleChanges) {
		if (
			changes.categories == null ||
			changes.categories.currentValue.length == 0
		) {
			return
		}

		await this.LoadStoreBooksByCategories()
	}

	async LoadLatestStoreBooks() {
		// Get the latest store books
		let response = await this.apiService.listStoreBooks(
			`
				items {
					uuid
					title
					cover {
						url
						blurhash
					}
				}
			`,
			{
				languages: await this.dataService.GetStoreLanguages(),
				limit: maxVisibleStoreBooks
			}
		)
		let responseData = response.data.listStoreBooks
		if (responseData == null) return

		this.ShowBooks(responseData.items)
	}

	async LoadStoreBooksByCategories() {
		// Get the store books with the given categories
		let categories = this.categories.filter(c => c != null)
		if (categories.length == 0) return

		let response = await this.apiService.listStoreBooks(
			`
				items {
					uuid
					title
					cover {
						url
						blurhash
					}
				}
			`,
			{
				categories,
				languages: await this.dataService.GetStoreLanguages()
			}
		)

		let responseData = response.data.listStoreBooks
		if (responseData == null) return

		let books = []

		for (let book of responseData.items) {
			if (book.uuid != this.currentBookUuid) {
				books.push(book)
			}
		}

		this.ShowBooks(books)
	}

	async LoadStoreBooksBySeries() {
		if (this.series.length == 0) return

		// Get the series
		let response = await this.apiService.retrieveStoreBookSeries(
			`
				storeBooks {
					items {
						uuid
						title
						cover {
							url
							blurhash
						}
					}
				}
			`,
			{
				uuid: this.series,
				languages: await this.dataService.GetStoreLanguages()
			}
		)
		let responseData = response.data.retrieveStoreBookSeries
		if (responseData == null) return

		this.ShowBooks(responseData.storeBooks.items)
	}

	async LoadStoreBooksRandomly() {
		let response = await this.apiService.listStoreBooks(
			`
				items {
					uuid
					title
					cover {
						url
						blurhash
					}
				}
			`,
			{
				random: true,
				languages: await this.dataService.GetStoreLanguages(),
				limit: maxVisibleStoreBooks
			}
		)

		let responseData = response.data.listStoreBooks
		if (responseData == null) return

		this.ShowBooks(responseData.items)
	}

	ShowBooks(books: StoreBookResource[]) {
		this.books = []

		for (let storeBook of books) {
			if (storeBook.cover == null) continue

			let height = 209
			let width = AdaptCoverWidthHeightToAspectRatio(
				135,
				height,
				storeBook.cover.aspectRatio
			)

			let bookItem: BookListItem = {
				uuid: storeBook.uuid,
				title: storeBook.title,
				coverContent: null,
				coverBlurhash: storeBook.cover.blurhash,
				coverWidth: width,
				coverHeight: height
			}

			this.apiService
				.downloadFile(storeBook.cover.url)
				.then((fileResponse: ApiResponse<string>) => {
					if (isSuccessStatusCode(fileResponse.status)) {
						bookItem.coverContent = (
							fileResponse as ApiResponse<string>
						).data
					}
				})

			this.books.push(bookItem)
		}

		this.loading = false
	}
}
