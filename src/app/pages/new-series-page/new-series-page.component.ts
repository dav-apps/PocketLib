import { Component } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { RoutingService } from "src/app/services/routing-service"
import { LocalizationService } from "src/app/services/localization-service"
import { SettingsService } from "src/app/services/settings-service"
import { Author } from "src/app/models/Author"

interface BookItem {
	uuid: string
	title: string
	cover: string
	checked: boolean
}

@Component({
	selector: "pocketlib-new-series-page",
	templateUrl: "./new-series-page.component.html",
	styleUrls: ["./new-series-page.component.scss"]
})
export class NewSeriesPageComponent {
	locale = this.localizationService.locale.newSeriesPage
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
		private localizationService: LocalizationService,
		private settingsService: SettingsService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {}

	async ngOnInit() {
		await this.dataService.userAuthorPromiseHolder.AwaitResult()

		// Get the author
		if (this.dataService.userIsAdmin) {
			// Get the uuid of the author from the url
			let authorUuid =
				this.activatedRoute.snapshot.paramMap.get("author_uuid")

			// Find the author with the uuid
			let author = this.dataService.adminAuthors.find(
				a => a.uuid == authorUuid
			)

			if (author == null) {
				author = await Author.Retrieve(
					authorUuid,
					await this.settingsService.getStoreLanguages(
						this.dataService.locale
					),
					this.apiService
				)
			}

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
		let collectionsResult = await this.author.GetCollections()

		for (let collection of collectionsResult.items) {
			let storeBooksResult = await collection.GetStoreBooks()

			for (let book of storeBooksResult.items) {
				if (
					book.status > 0 &&
					book.cover.url != null &&
					book.language == this.language
				) {
					let bookItem: BookItem = {
						uuid: book.uuid,
						title: book.title,
						cover: null,
						checked: false
					}

					book.GetCoverContent().then(result => (bookItem.cover = result))
					this.bookItems.push(bookItem)
					break
				}
			}
		}

		this.booksLoading = false
	}

	GoBack() {
		this.routingService.navigateBack("/author")
	}

	SetLanguage(language: string) {
		this.language = language
		this.selectedBooks = []

		this.LoadBooks()
	}

	ToggleSelectedBook(bookItem: BookItem) {
		bookItem.checked = !bookItem.checked

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
		let createStoreBookSeriesResponse =
			await this.apiService.createStoreBookSeries(`uuid`, {
				author: authorUuid,
				name: this.name,
				language: this.language,
				storeBooks: storeBookUuids
			})

		if (createStoreBookSeriesResponse.errors != null) {
			this.errorMessage = this.locale.errorMessage
			this.loading = false
			return
		}

		// Reload the author
		//this.author.ClearSeries()

		// Redirect to the author profile
		this.dataService.navbarVisible = true
		if (this.dataService.userIsAdmin) {
			this.router.navigate(["author", this.author.uuid])
		} else {
			this.router.navigate(["author"])
		}
	}
}
