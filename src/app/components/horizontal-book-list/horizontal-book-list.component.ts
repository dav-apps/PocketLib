import { Component, Input, SimpleChanges } from "@angular/core"
import { Router } from "@angular/router"
import { faArrowRight as faArrowRightLight } from "@fortawesome/pro-light-svg-icons"
import { isSuccessStatusCode } from "dav-js"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { SettingsService } from "src/app/services/settings-service"
import {
	BookListItem,
	ApiResponse,
	StoreBookResource,
	VlbItemResource
} from "src/app/misc/types"
import { AdaptCoverWidthHeightToAspectRatio } from "src/app/misc/utils"

type HorizontalBookListType =
	| "latest"
	| "categories"
	| "series"
	| "collection"
	| "random"
type HorizontalBookListAlignment = "start" | "center"

@Component({
	selector: "pocketlib-horizontal-book-list",
	templateUrl: "./horizontal-book-list.component.html",
	styleUrls: ["./horizontal-book-list.component.scss"]
})
export class HorizontalBookListComponent {
	@Input() type: HorizontalBookListType = "latest"
	@Input() headline: string = ""
	@Input() page: number = 1
	@Input() currentBookUuid: string = ""
	@Input() categories: string[] = []
	@Input() series: string = ""
	@Input() collectionId: string = ""
	@Input() maxItems: number = 10
	@Input() hideMoreButton: boolean = false
	@Input() alignment: HorizontalBookListAlignment = "start"
	faArrowRightLight = faArrowRightLight
	books: BookListItem[] = []
	hasMoreItems: boolean = false
	loading: boolean = true

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private settingsService: SettingsService,
		private router: Router
	) {}

	async ngOnInit() {
		if (this.type == "categories") {
			if (this.categories.length == 0) return
			await this.LoadStoreBooksByCategories()
		} else if (this.type == "series") {
			await this.LoadStoreBooksBySeries()
		} else if (this.type == "collection") {
			await this.LoadVlbItemsByCollectionId()
		} else if (this.type == "random") {
			await this.LoadStoreBooksRandomly()
		} else {
			await this.LoadLatestStoreBooks()
		}
	}

	async ngOnChanges(changes: SimpleChanges) {
		if (changes.series != null && changes.series.currentValue != null) {
			await this.LoadStoreBooksBySeries()
		} else if (
			changes.collectionId != null &&
			changes.collectionId.currentValue != null
		) {
			await this.LoadVlbItemsByCollectionId()
		} else if (
			changes.categories != null &&
			changes.categories.currentValue.length > 0
		) {
			await this.LoadStoreBooksByCategories()
		}
	}

	async LoadLatestStoreBooks() {
		// Get the latest store books
		let page = this.page - 1
		if (page < 0) page = 0

		let response = await this.apiService.listStoreBooks(
			`
				total
				items {
					uuid
					slug
					title
					cover {
						url
						blurhash
					}
				}
			`,
			{
				languages: await this.settingsService.getStoreLanguages(
					this.dataService.locale
				),
				limit: this.maxItems,
				offset: this.maxItems * page
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
					slug
					title
					cover {
						url
						blurhash
					}
				}
			`,
			{
				categories,
				languages: await this.settingsService.getStoreLanguages(
					this.dataService.locale
				),
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
						slug
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
				languages: await this.settingsService.getStoreLanguages(
					this.dataService.locale
				),
				limit: this.maxItems
			}
		)
		let responseData = response.data.retrieveStoreBookSeries
		if (responseData == null) return

		this.ShowBooks(responseData.storeBooks.items)
		this.hasMoreItems = responseData.storeBooks.total > this.maxItems
	}

	async LoadVlbItemsByCollectionId() {
		if (this.collectionId.length == 0) return

		let response = await this.apiService.listVlbItems(
			`
				total
				items {
					uuid
					slug
					title
					description
					coverUrl
				}
			`,
			{
				vlbCollectionUuid: this.collectionId,
				limit: this.maxItems
			}
		)

		let responseData = response.data.listVlbItems
		if (responseData == null) return

		this.ShowBooks(responseData.items)
		this.hasMoreItems = responseData.total > this.maxItems
	}

	async LoadStoreBooksRandomly() {
		let total = 0
		let page = this.page - 1
		if (page < 0) page = 0

		if (this.dataService.locale.startsWith("de")) {
			let response = await this.apiService.listVlbItems(
				`
					total
					items {
						uuid
						slug
						title
						description
						coverUrl
					}
				`,
				{
					random: true,
					limit: this.maxItems,
					offset: this.maxItems * page
				}
			)

			let responseData = response.data.listVlbItems
			if (responseData == null) return

			this.ShowBooks(responseData.items)
			total = responseData.total
		} else {
			let response = await this.apiService.listStoreBooks(
				`
					total
					items {
						uuid
						slug
						title
						cover {
							url
							blurhash
						}
					}
				`,
				{
					random: true,
					languages: await this.settingsService.getStoreLanguages(
						this.dataService.locale
					),
					limit: this.maxItems,
					offset: this.maxItems * page
				}
			)

			let responseData = response.data.listStoreBooks
			if (responseData == null) return

			this.ShowBooks(responseData.items)
			total = responseData.total
		}

		this.hasMoreItems = total > this.maxItems
	}

	ShowBooks(books: StoreBookResource[] | VlbItemResource[]) {
		this.books = []

		if (books.length == 0) {
			this.loading = false
			return
		}

		if (books[0].__typename == "StoreBook") {
			// books is StoreBookResource[]
			for (let book of books) {
				let storeBook = book as StoreBookResource
				if (storeBook.cover == null) continue

				let height = 209
				let width = AdaptCoverWidthHeightToAspectRatio(
					135,
					height,
					storeBook.cover.aspectRatio
				)

				let bookListItem: BookListItem = {
					uuid: storeBook.uuid,
					slug: storeBook.slug,
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
							bookListItem.coverContent = (
								fileResponse as ApiResponse<string>
							).data
						}
					})

				this.books.push(bookListItem)
			}
		} else {
			// books is VlbItemResource[]
			for (let book of books) {
				let vlbItem = book as VlbItemResource
				if (vlbItem.coverUrl == null) continue

				this.books.push({
					uuid: vlbItem.uuid,
					slug: vlbItem.slug,
					title: vlbItem.title,
					coverContent: vlbItem.coverUrl,
					coverBlurhash: null,
					coverWidth: null,
					coverHeight: 209
				})
			}
		}

		this.loading = false
	}

	moreButtonClick() {
		if (this.type == "categories") {
			if (this.categories.length == 0) return

			this.router.navigate(["store", "category", this.categories[0]])
		} else if (this.type == "collection") {
			this.router.navigate(["store", "series", this.collectionId])
		}
	}
}
