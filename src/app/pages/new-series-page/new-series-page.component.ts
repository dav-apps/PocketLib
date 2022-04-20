import { Component } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { isSuccessStatusCode } from 'dav-js'
import { DataService } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { RoutingService } from 'src/app/services/routing-service'
import { Author } from 'src/app/models/Author'
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
	author: Author
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

			if (author == null) {
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

		this.LoadBooks()
	}

	async LoadBooks() {
		this.booksLoading = true
		this.bookItems = []

		// Get the books that can be selected (status = review, published or hidden; language = current language)
		for (let collection of await this.author.GetCollections()) {
			for (let book of await collection.GetStoreBooks()) {
				if (book.status > 0 && book.cover.url != null && book.language == this.language) {
					let bookItem: BookItem = {
						uuid: book.uuid,
						title: book.title,
						cover: null,
						checked: false
					}

					book.GetCoverContent().then(result => bookItem.cover = result)
					this.bookItems.push(bookItem)
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
		let storeBookUuids: string[] = []

		for (let book of this.selectedBooks) {
			storeBookUuids.push(book.uuid)
		}

		// Create the StoreBookSeries
		let createStoreBookSeriesResponse = await this.apiService.CreateStoreBookSeries({
			author: authorUuid,
			name: this.name,
			language: this.language,
			storeBooks: storeBookUuids
		})

		if (!isSuccessStatusCode(createStoreBookSeriesResponse.status)) {
			this.errorMessage = this.locale.errorMessage
			this.loading = false
			return
		}

		// Reload the author
		this.author.ClearSeries()

		// Redirect to the author profile
		this.dataService.navbarVisible = true
		if (this.dataService.userIsAdmin) {
			this.router.navigate(["author", this.author.uuid])
		} else {
			this.router.navigate(["author"])
		}
	}
}