import { Component } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { DataService, FindAppropriateLanguage } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { RoutingService } from 'src/app/services/routing-service'
import { GetDualScreenSettings } from 'src/app/misc/utils'
import { StoreBookSeries } from 'src/app/misc/types'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-author-series-page',
	templateUrl: './author-series-page.component.html'
})
export class AuthorSeriesPageComponent {
	locale = enUS.authorSeriesPage
	uuid: string = ""
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	series: StoreBookSeries = { uuid: "", names: [], collections: [] }
	seriesName: { name: string, language: string } = { name: "", language: "" }
	author: string = ""
	backButtonLink: string = ""

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private routingService: RoutingService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().authorSeriesPage

		// Check if this is a dual-screen device with a vertical fold
		let dualScreenSettings = GetDualScreenSettings()
		this.dualScreenLayout = dualScreenSettings.dualScreenLayout
		this.dualScreenFoldMargin = dualScreenSettings.dualScreenFoldMargin

		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid')
	}

	async ngOnInit() {
		// Wait for the user to be loaded
		await this.dataService.userPromiseHolder.AwaitResult()
		await this.dataService.userAuthorPromiseHolder.AwaitResult()
		await this.dataService.adminAuthorsPromiseHolder.AwaitResult()

		if (this.dataService.userIsAdmin) {
			// Find the series in the collections of the authors of the user
			for (let author of this.dataService.adminAuthors) {
				let series = author.series.find(s => s.uuid == this.uuid)
				if (series != null) {
					this.series = series
					this.author = author.uuid
					break
				}
			}
		} else if (this.dataService.userAuthor != null) {
			let series = this.dataService.userAuthor.series.find(s => s.uuid == this.uuid)
			if (series != null) this.series = series
		}

		if (this.series == null) {
			// Redirect back to the author profile
			this.routingService.NavigateBack("/author")
		}

		// Get the series name for the appropriate language
		let i = FindAppropriateLanguage(this.dataService.supportedLocale, this.series.names)
		if (i != -1) this.seriesName = this.series.names[i]

		// Set the back button link
		this.backButtonLink =  this.dataService.userIsAdmin ? `/author/${this.author}` : `/author`
	}
}