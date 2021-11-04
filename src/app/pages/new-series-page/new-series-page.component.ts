import { Component, HostListener } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { PromiseHolder } from 'dav-js'
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
	loading: boolean = false
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
	errorMessage: string = ""
	//#endregion

	//#region Name variables
	name: string = ""
	submittedName: string = ""
	nameSubmitted: boolean = false
	//#endregion

	//#region Book selection variables
	selectableBooks: StoreBook[] = []
	selectedBooks: string[] = []
	loadCollectionsPromiseHolder = new PromiseHolder()
	//#endregion

	//#region Loading screen variables
	height: number = 400
	loadingScreenVisible: boolean = false
	//#endregion

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private routingService: RoutingService,
		private router: Router,
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

		this.loadCollectionsPromiseHolder.Resolve()
	}

	@HostListener('window:resize')
	setSize() {
		this.height = window.innerHeight
	}

	GoBack() {
		this.routingService.NavigateBack("/author")
	}

	async SubmitName(name: string) {
		this.name = name

		// Wait for the collections
		this.loading = true
		await this.loadCollectionsPromiseHolder.AwaitResult()
		this.loading = false

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

	HideLoadingScreen() {
		this.dataService.navbarVisible = true
		this.loadingScreenVisible = false
	}

	async Finish() {
		this.ShowLoadingScreen()
		let authorUuid = this.dataService.userIsAdmin ? this.author.uuid : null
		let collectionUuids: string[] = []

		// Get the collection uuids of the books
		for (let bookUuid of this.selectedBooks) {
			let collection = this.author.collections.find(collection => collection.books.findIndex(b => b.uuid == bookUuid) != -1)
			if (collection != null) collectionUuids.push(collection.uuid)
		}

		// Create the StoreBookSeries
		let createStoreBookSeriesResponse = await this.apiService.CreateStoreBookSeries({
			author: authorUuid,
			name: this.name,
			language: this.dataService.supportedLocale,
			collections: collectionUuids
		})

		if (createStoreBookSeriesResponse.status != 201) {
			this.errorMessage = this.locale.errorMessage
			this.HideLoadingScreen()
			return
		}

		// Redirect to the author profile
		this.dataService.navbarVisible = true
		if (this.dataService.userIsAdmin) {
			this.router.navigate(["author", this.author.uuid])
		} else {
			this.router.navigate(["author"])
		}
	}
}