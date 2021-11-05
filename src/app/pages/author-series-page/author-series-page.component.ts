import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { DataService, FindAppropriateLanguage } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { RoutingService } from 'src/app/services/routing-service'
import { GetDualScreenSettings } from 'src/app/misc/utils'
import { Author, StoreBook, StoreBookSeries } from 'src/app/misc/types'
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
	author: Author
	series: StoreBookSeries = { uuid: "", names: [], collections: [] }
	books: StoreBook[] = []
	seriesName: { name: string, language: string } = { name: "", language: "" }
	seriesNames: { name: string, language: string, fullLanguage: string, edit: boolean }[] = []
	namesDialogVisible: boolean = false
	backButtonLink: string = ""
	addButtonHover: boolean = false

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private routingService: RoutingService,
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
					this.author = author
					break
				}
			}
		} else if (this.dataService.userAuthor != null) {
			this.author = this.dataService.userAuthor

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
		this.backButtonLink = this.dataService.userIsAdmin ? `/author/${this.author.uuid}` : `/author`

		// Load the collection of the author
		await this.apiService.LoadCollectionsOfAuthor(this.author)

		// Get the books of the series
		for (let collectionUuid of this.series.collections) {
			let collection = this.author.collections.find(c => c.uuid == collectionUuid)
			if (collection == null) continue

			// Get the first book in the appropriate language
			let book = collection.books.find(book => book.language == this.seriesName.language)
			if (book == null) continue

			this.books.push(book)
		}
	}

	ShowNamesDialog() {
		// Update the series names for the EditNames component
		this.seriesNames = []
		let languages = this.dataService.GetLocale().misc.languages

		for (let seriesName of this.series.names) {
			this.seriesNames.push({
				name: seriesName.name,
				language: seriesName.language,
				fullLanguage: seriesName.language == "de" ? languages.de : languages.en,
				edit: false
			})
		}

		this.namesDialogVisible = true
	}

	UpdateSeriesName(seriesName: { name: string, language: string }) {
		if (this.seriesName.language == seriesName.language) {
			// Update the title
			this.seriesName.name = seriesName.name
		} else {
			let i = this.series.names.findIndex(name => name.language == seriesName.language)

			if (i == -1) {
				// Add the name to the series
				this.series.names.push(seriesName)

				// Set the title if the name for the current language was just added
				let j = FindAppropriateLanguage(this.dataService.supportedLocale, this.series.names)
				if (j != -1) this.seriesName = this.series.names[j]
			} else {
				// Update the name in the series
				this.series.names[i].name = seriesName.name
			}
		}
	}

	ShowAddBookDialog() {
		
	}
}