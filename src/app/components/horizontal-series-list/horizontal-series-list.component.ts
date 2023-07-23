import { Component } from "@angular/core"
import { ApiErrorResponse, ApiResponse, isSuccessStatusCode } from "dav-js"
import { DataService } from "src/app/services/data-service"
import { GraphQLService } from "src/app/services/graphql-service"
import { BookListItem, SeriesListItem } from "src/app/misc/types"
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
		private graphqlService: GraphQLService
	) {
		this.locale = this.dataService.GetLocale().horizontalSeriesList
	}

	async ngOnInit() {
		let response = await this.graphqlService.listStoreBookSeries(
			`
				items {
					uuid
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
				}
			`,
			{
				latest: true,
				languages: await this.dataService.GetStoreLanguages(),
				limit: maxVisibleSeries
			}
		)

		let responseData = response.data.listStoreBookSeries
		if (responseData == null) return

		for (let series of responseData.items) {
			let seriesItem: SeriesListItem = {
				uuid: series.uuid,
				books: []
			}

			for (let book of series.storeBooks.items) {
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

				this.graphqlService
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
