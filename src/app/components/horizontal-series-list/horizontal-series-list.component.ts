import { Component } from "@angular/core"
import { ApiErrorResponse, ApiResponse, isSuccessStatusCode } from "dav-js"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import {
	BookListItem,
	ListResponseData,
	SeriesListItem,
	StoreBookListField,
	StoreBookResource,
	StoreBookSeriesListField,
	StoreBookSeriesResource
} from "src/app/misc/types"
import { AdaptCoverWidthHeightToAspectRatio } from "src/app/misc/utils"
import { enUS } from "src/locales/locales"

const maxVisibleSeries = 5

@Component({
	selector: "pocketlib-horizontal-series-list",
	templateUrl: "./horizontal-series-list.component.html",
	styleUrls: ["./horizontal-series-list.component.scss"]
})
export class HorizontalSeriesListComponent {
	locale = enUS.horizontalSeriesList
	series: SeriesListItem[] = []
	loading: boolean = true

	constructor(
		public dataService: DataService,
		private apiService: ApiService
	) {
		this.locale = this.dataService.GetLocale().horizontalSeriesList
	}

	async ngOnInit() {
		let seriesResponse = await this.apiService.ListStoreBookSeries({
			fields: [StoreBookSeriesListField.items_uuid],
			languages: await this.dataService.GetStoreLanguages(),
			latest: true,
			limit: maxVisibleSeries
		})

		if (!isSuccessStatusCode(seriesResponse.status)) return
		let seriesResponseData = (
			seriesResponse as ApiResponse<
				ListResponseData<StoreBookSeriesResource>
			>
		).data

		for (let series of seriesResponseData.items) {
			let storeBookResponse = await this.apiService.ListStoreBooks({
				fields: [
					StoreBookListField.items_uuid,
					StoreBookListField.items_title,
					StoreBookListField.items_cover
				],
				languages: await this.dataService.GetStoreLanguages(),
				series: series.uuid
			})

			if (!isSuccessStatusCode(storeBookResponse.status)) continue
			let storeBookResponseData = (
				storeBookResponse as ApiResponse<
					ListResponseData<StoreBookResource>
				>
			).data

			let seriesItem: SeriesListItem = {
				uuid: series.uuid,
				books: []
			}

			for (let book of storeBookResponseData.items) {
				let height = 165
				let width = AdaptCoverWidthHeightToAspectRatio(
					106,
					height,
					book.cover.aspectRatio
				)

				let bookItem: BookListItem = {
					uuid: book.uuid,
					title: book.title,
					coverContent: null,
					coverBlurhash: book.cover.blurhash,
					coverWidth: width,
					coverHeight: height
				}

				this.apiService
					.GetFile({ url: book.cover.url })
					.then((fileResponse: ApiResponse<string> | ApiErrorResponse) => {
						if (isSuccessStatusCode(fileResponse.status)) {
							bookItem.coverContent = (
								fileResponse as ApiResponse<string>
							).data
						}
					})

				seriesItem.books.push(bookItem)
			}

			this.series.push(seriesItem)
		}

		this.loading = false
	}
}
