import { Component, Input, SimpleChanges } from "@angular/core"
import { ApiErrorResponse, ApiResponse, isSuccessStatusCode } from "dav-js"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import {
	BookListItem,
	ListResponseData,
	StoreBookListField,
	StoreBookResource,
	StoreBookSeriesField,
	StoreBookSeriesResource
} from "src/app/misc/types"
import { AdaptCoverWidthHeightToAspectRatio } from "src/app/misc/utils"
import { enUS } from "src/locales/locales"

const maxVisibleStoreBooks = 7
type HorizontalBookListType = "latest" | "categories" | "series"

@Component({
	selector: "pocketlib-horizontal-book-list",
	templateUrl: "./horizontal-book-list.component.html",
	styleUrls: ["./horizontal-book-list.component.scss"]
})
export class HorizontalBookListComponent {
	@Input() type: HorizontalBookListType = "latest"
	@Input() currentBookUuid: string = ""
	@Input() categories: string[] = []
	@Input() series: string = ""
	locale = enUS.horizontalBookList
	header: string = ""
	books: BookListItem[] = []
	loading: boolean = true

	constructor(
		public dataService: DataService,
		private apiService: ApiService
	) {
		this.locale = this.dataService.GetLocale().horizontalBookList
	}

	async ngOnInit() {
		this.SetHeader()

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
			changes.categories == null ||
			changes.categories.currentValue.length == 0
		) {
			return
		}

		this.SetHeader()
		await this.LoadStoreBooksByCategories()
	}

	SetHeader() {
		if (this.type == "latest") {
			this.header = this.locale.recentlyPublished
		} else if (this.type == "categories") {
			this.header =
				this.categories.length == 1
					? this.locale.moreBooksInCategory
					: this.locale.moreBooksInCategories
		}
	}

	async LoadLatestStoreBooks() {
		// Get the latest store books
		let response = await this.apiService.ListStoreBooks({
			fields: [
				StoreBookListField.items_uuid,
				StoreBookListField.items_title,
				StoreBookListField.items_cover
			],
			languages: await this.dataService.GetStoreLanguages(),
			limit: maxVisibleStoreBooks,
			latest: true
		})

		if (!isSuccessStatusCode(response.status)) return
		this.ShowBooks(
			(response as ApiResponse<ListResponseData<StoreBookResource>>).data
				.items
		)
	}

	async LoadStoreBooksByCategories() {
		// Get the store books with the given categories
		let response = await this.apiService.ListStoreBooks({
			fields: [
				StoreBookListField.items_uuid,
				StoreBookListField.items_title,
				StoreBookListField.items_cover
			],
			languages: await this.dataService.GetStoreLanguages(),
			categories: this.categories
		})

		if (!isSuccessStatusCode(response.status)) return

		let books = (response as ApiResponse<ListResponseData<StoreBookResource>>)
			.data.items

		// Remove the current book
		let i = books.findIndex(book => book.uuid == this.currentBookUuid)
		if (i != -1) books.splice(i, 1)

		this.ShowBooks(books)
	}

	async LoadStoreBooksBySeries() {
		if (this.series.length == 0) return

		// Get the series
		let seriesResponse = await this.apiService.RetrieveStoreBookSeries({
			uuid: this.series,
			fields: [StoreBookSeriesField.name]
		})

		if (!isSuccessStatusCode(seriesResponse.status)) return
		let seriesResponseData = (
			seriesResponse as ApiResponse<StoreBookSeriesResource>
		).data

		this.header = this.locale.moreOfSeries.replace(
			"{0}",
			seriesResponseData.name
		)

		// Get the store books of the series
		let response = await this.apiService.ListStoreBooks({
			fields: [
				StoreBookListField.items_uuid,
				StoreBookListField.items_title,
				StoreBookListField.items_cover
			],
			languages: await this.dataService.GetStoreLanguages(),
			series: this.series
		})

		if (!isSuccessStatusCode(response.status)) return

		let responseData = (
			response as ApiResponse<ListResponseData<StoreBookResource>>
		).data

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
				.GetFile({ url: storeBook.cover.url })
				.then((fileResponse: ApiResponse<string> | ApiErrorResponse) => {
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
