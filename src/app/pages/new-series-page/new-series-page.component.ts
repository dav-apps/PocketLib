import { Component } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { DataService } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { RoutingService } from 'src/app/services/routing-service'
import { Author } from 'src/app/misc/types'
import { GetDualScreenSettings } from 'src/app/misc/utils'
import { enUS } from 'src/locales/locales'

interface BookItem {
	uuid: string
	title: string
	cover: string
	checked: boolean
}

@Component({
	selector: 'pocketlib-new-series-page',
	templateUrl: './new-series-page.component.html'
})
export class NewSeriesPageComponent {
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
		profileImage: null,
		bios: [],
		collections: [],
		series: []
	}
	booksLoading: boolean = true
	loading: boolean = false
	errorMessage: string = ""
	language: string = this.dataService.supportedLocale
	name: string = ""
	bookItems: BookItem[] = []
	selectedBooks: BookItem[] = []

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
		this.LoadBooks()
	}

	LoadBooks() {
		this.booksLoading = true
		this.bookItems = []

		// Get the books that can be selected (status = review, published or hidden; language = current language)
		for (let collection of this.author.collections) {
			for (let book of collection.books) {
				if (book.status > 0 && book.language == this.language) {
					this.bookItems.push({
						uuid: book.uuid,
						title: book.title,
						cover: book.coverContent,
						checked: false
					})

					break
				}
			}
		}

		this.booksLoading = false
	}

	GoBack() {
		this.routingService.NavigateBack("/author")
	}

	SetLanguage(language: string) {
		this.language = language
		this.selectedBooks = []

		this.LoadBooks()
	}

	ToggleSelectedBook(bookItem: BookItem) {
		bookItem.checked = !bookItem.checked
		let i = this.bookItems.findIndex(b => b.uuid == bookItem.uuid)

		if (i != -1) {
			this.bookItems[i].checked = bookItem.checked
		}

		// Get the selected books
		this.selectedBooks = []

		for (let book of this.bookItems) {
			if (book.checked) {
				this.selectedBooks.push(book)
			}
		}
	}

	async Submit() {
		this.loading = true

		let authorUuid = this.dataService.userIsAdmin ? this.author.uuid : null
		let collectionUuids: string[] = []

		// Get the collection uuids of the books
		for (let book of this.selectedBooks) {
			let collection = this.author.collections.find(collection => collection.books.findIndex(b => b.uuid == book.uuid) != -1)
			if (collection != null) collectionUuids.push(collection.uuid)
		}

		// Create the StoreBookSeries
		let createStoreBookSeriesResponse = await this.apiService.CreateStoreBookSeries({
			author: authorUuid,
			name: this.name,
			language: this.language,
			collections: collectionUuids
		})

		if (createStoreBookSeriesResponse.status != 201) {
			this.errorMessage = this.locale.errorMessage
			this.loading = false
			return
		}

		// Reload the author
		await this.dataService.LoadAuthorOfUser()

		// Redirect to the author profile
		this.dataService.navbarVisible = true
		if (this.dataService.userIsAdmin) {
			this.router.navigate(["author", this.author.uuid])
		} else {
			this.router.navigate(["author"])
		}
	}
}