import { Component, Input } from "@angular/core"
import { isSuccessStatusCode } from "dav-js"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { SettingsService } from "src/app/services/settings-service"
import {
	BookListItem,
	SeriesListItem,
	ApiResponse,
	Language
} from "src/app/misc/types"
import { AdaptCoverWidthHeightToAspectRatio } from "src/app/misc/utils"

const maxVisibleSeries = 5
type HorizontalSeriesListType = "latest" | "random"

@Component({
	selector: "pocketlib-horizontal-series-list",
	templateUrl: "./horizontal-series-list.component.html",
	styleUrl: "./horizontal-series-list.component.scss",
	standalone: false
})
export class HorizontalSeriesListComponent {
	@Input() type: HorizontalSeriesListType = "latest"
	@Input() headline: string = ""
	series: SeriesListItem[] = []
	loading: boolean = true

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private settingsService: SettingsService
	) {}

	async ngOnInit() {
		let languages = await this.settingsService.getStoreLanguages()

		if (languages.includes(Language.de)) {
			// Show VlbCollections
			await this.loadVlbCollections()
		} else {
			// Show StoreBookSeries
			await this.loadStoreBookSeries()
		}
	}

	async loadStoreBookSeries() {
		let response = await this.apiService.listStoreBookSeries(
			`
				items {
					uuid
					storeBooks {
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
				}
			`,
			{
				random: this.type == "random",
				languages: await this.settingsService.getStoreLanguages(),
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
					slug: book.slug,
					title: book.title,
					coverContent: null,
					coverBlurhash: book.cover.blurhash,
					coverWidth: width,
					coverHeight: height
				}

				this.apiService
					.downloadFile(book.cover.url)
					.then((fileResponse: ApiResponse<string>) => {
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

	async loadVlbCollections() {
		let response = await this.apiService.listVlbCollections(
			`
				items {
					uuid
					slug
					vlbItems(limit: 6) {
						items {
							uuid
							slug
							title
							coverUrl
						}
					}
				}
			`,
			{
				random: this.type == "random",
				limit: maxVisibleSeries
			}
		)

		let responseData = response.data.listVlbCollections
		if (responseData == null) return

		for (let vlbCollection of responseData.items) {
			let collectionItem: SeriesListItem = {
				uuid: vlbCollection.uuid,
				books: []
			}

			for (let vlbItem of vlbCollection.vlbItems.items) {
				if (vlbItem.coverUrl == null) continue

				collectionItem.books.push({
					uuid: vlbItem.uuid,
					slug: vlbItem.slug,
					title: vlbItem.title,
					coverContent: vlbItem.coverUrl,
					coverBlurhash: null,
					coverWidth: null,
					coverHeight: 165
				})
			}

			this.series.push(collectionItem)
		}

		this.loading = false
	}
}
