import { Component } from '@angular/core'
import { ApiResponse } from 'dav-js'
import { DataService } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { BookListItem, SeriesListItem } from 'src/app/misc/types'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-horizontal-series-list',
	templateUrl: './horizontal-series-list.component.html'
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
		let response = await this.apiService.GetLatestStoreBookSeries({
			languages: await this.dataService.GetStoreLanguages()
		})

		if (response.status != 200) return
		let series = (response as ApiResponse<any>).data.series

		for (let s of series) {
			let seriesItem: SeriesListItem = {
				uuid: s.uuid,
				books: []
			}

			for (let book of s.books) {
				let width = 96
				let height = 150

				if (book.cover_aspect_ratio != null) {
					let parts = book.cover_aspect_ratio.split(':')
					let widthAspectRatio = +parts[0]
					let heightAspectRatio = +parts[1]

					if (widthAspectRatio == 1) {
						// 1:2 -> 0.5:1
						widthAspectRatio /= heightAspectRatio
					}

					width = Math.round(height * widthAspectRatio)
				}

				let bookItem: BookListItem = {
					uuid: book.uuid,
					title: book.title,
					cover: book.cover,
					coverContent: null,
					coverBlurhash: book.cover_blurhash,
					coverWidth: width,
					coverHeight: height
				}

				this.apiService.GetStoreBookCover({ uuid: book.uuid }).then((result: ApiResponse<string>) => {
					bookItem.coverContent = result.data
				})

				seriesItem.books.push(bookItem)
			}

			this.series.push(seriesItem)
		}

		this.loading = false
	}
}