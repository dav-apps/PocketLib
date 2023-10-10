import { Component, Input, SimpleChanges } from "@angular/core"
import { Router } from "@angular/router"
import { faArrowRight as faArrowRightLight } from "@fortawesome/pro-light-svg-icons"
import { isSuccessStatusCode } from "dav-js"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import {
	BookListItem,
	ApiResponse,
	StoreBookResource
} from "src/app/misc/types"
import { AdaptCoverWidthHeightToAspectRatio } from "src/app/misc/utils"

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
	@Input() maxItems: number = 10
	@Input() hideMoreButton: boolean = false
	faArrowRightLight = faArrowRightLight
	books: BookListItem[] = []
	hasMoreItems: boolean = false
	loading: boolean = true

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private router: Router
	) {}

	async ngOnInit() {
		if (this.type == "categories") {
			if (this.categories.length == 0) return
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
				total
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
				limit: this.maxItems
			}
		)
		let responseData = response.data.listStoreBooks
		if (responseData == null) return

		this.ShowBooks(responseData.items)
		this.hasMoreItems = responseData.total > this.maxItems
	}

	async LoadStoreBooksByCategories() {
		// Get the store books with the given categories
		let categories = this.categories.filter(c => c != null)
		if (categories.length == 0) return

		let response = await this.apiService.listStoreBooks(
			`
				total
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
				languages: await this.dataService.GetStoreLanguages(),
				limit: this.maxItems
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
		this.hasMoreItems = responseData.total > this.maxItems
	}

	async LoadStoreBooksBySeries() {
		if (this.series.length == 0) return

		// Get the series
		let response = await this.apiService.retrieveStoreBookSeries(
			`
				storeBooks {
					total
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
				languages: await this.dataService.GetStoreLanguages(),
				limit: this.maxItems
			}
		)
		let responseData = response.data.retrieveStoreBookSeries
		if (responseData == null) return

		this.ShowBooks(responseData.storeBooks.items)
		this.hasMoreItems = responseData.storeBooks.total > this.maxItems
	}

	async LoadStoreBooksRandomly() {
		let response = await this.apiService.listStoreBooks(
			`
				total
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
				limit: this.maxItems
			}
		)

		let responseData = response.data.listStoreBooks
		if (responseData == null) return

		this.ShowBooks(responseData.items)
		this.hasMoreItems = responseData.total > this.maxItems
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

	moreButtonClick() {
		if (this.categories.length == 0) return

		this.router.navigate(["store", "category", this.categories[0]])
	}
}
