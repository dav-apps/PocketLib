import { Component, HostListener } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { DataService } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { RoutingService } from 'src/app/services/routing-service'
import { Author, StoreBook } from 'src/app/misc/types'
import { GetDualScreenSettings } from 'src/app/misc/utils'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-new-series-page',
	templateUrl: './new-series-page.component.html'
})
export class NewSeriesPageComponent {
	//#region Navigation variables
	section: number = 0
	visibleSection: number = 0
	forwardNavigation: boolean = true
	//#endregion

	//#region General variables
	locale = enUS.newSeriesPage
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	author: Author = {
		uuid: "",
		firstName: "",
		lastName: "",
		websiteUrl: null,
		facebookUsername: null,
		instagramUsername: null,
		twitterUsername: null,
		bios: [],
		collections: [],
		series: [],
		profileImage: false,
		profileImageBlurhash: null
	}
	//#endregion

	//#region Name variables
	name: string = ""
	submittedName: string = ""
	nameSubmitted: boolean = false
	//#endregion

	//#region Book selection variables
	selectableBooks: StoreBook[] = []
	selectedBooks: string[] = []
	//#endregion

	//#region Loading screen variables
	height: number = 400
	loadingScreenVisible: boolean = false
	//#endregion

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private routingService: RoutingService,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().newSeriesPage

		// Check if this is a dual-screen device with a vertical fold
		let dualScreenSettings = GetDualScreenSettings()
		this.dualScreenLayout = dualScreenSettings.dualScreenLayout
		this.dualScreenFoldMargin = dualScreenSettings.dualScreenFoldMargin
	}

	async ngOnInit() {
		this.setSize()
		await this.dataService.userAuthorPromiseHolder.AwaitResult()

		// Get the author
		if (this.dataService.userIsAdmin) {
			// Get the uuid of the author from the url
			let authorUuid = this.activatedRoute.snapshot.queryParamMap.get("author")

			// Find the author with the uuid
			let author = this.dataService.adminAuthors.find(a => a.uuid == authorUuid)
			if (!author) {
				this.GoBack()
				return
			}

			this.author = author
		} else if (this.dataService.userAuthor) {
			// Get the current author
			this.author = this.dataService.userAuthor
		} else {
			// Go back, as the user it not an author and not an admin
			this.GoBack()
			return
		}

		// Load the books of the author
		await this.apiService.LoadCollectionsOfAuthor(this.author)

		// Get the books that can be selected (status = review, published or hidden; language = current language)
		for (let collection of this.author.collections) {
			for (let book of collection.books) {
				if (book.status > 0 && book.language == this.dataService.supportedLocale) {
					this.selectableBooks.push(book)
					break
				}
			}
		}
	}

	@HostListener('window:resize')
	setSize() {
		this.height = window.innerHeight
	}

	GoBack() {
		this.routingService.NavigateBack("/author")
	}

	SubmitName(name: string) {
		this.name = name

		this.Next()

		this.submittedName = this.name
		this.nameSubmitted = true
	}

	SelectedBooksChange(selectedBooks: string[]) {
		this.selectedBooks = selectedBooks
	}

	Previous() {
		this.NavigateToSection(this.section - 1)
	}

	Next() {
		this.NavigateToSection(this.section + 1)
	}

	NavigateToSection(index: number) {
		this.forwardNavigation = index > this.section
		this.section = index

		setTimeout(() => {
			this.visibleSection = index
		}, 500)
	}

	ShowLoadingScreen() {
		this.loadingScreenVisible = true

		setTimeout(() => {
			this.dataService.navbarVisible = false

			// Set the color of the progress ring
			let progress = document.getElementsByTagName('circle')
			if (progress.length > 0) {
				let item = progress.item(0)
				item.setAttribute('style', item.getAttribute('style') + ' stroke: white')
			}
		}, 1)
	}

	Finish() {
		this.ShowLoadingScreen()
	}
}