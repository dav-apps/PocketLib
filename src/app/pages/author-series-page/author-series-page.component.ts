import { Component } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { DragulaService } from 'ng2-dragula'
import { ApiErrorResponse, isSuccessStatusCode } from 'dav-js'
import { DataService } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { CachingService } from 'src/app/services/caching-service'
import { RoutingService } from 'src/app/services/routing-service'
import { Author } from 'src/app/models/Author'
import { StoreBookSeries } from 'src/app/models/StoreBookSeries'
import { StoreBook } from 'src/app/models/StoreBook'
import { GetDualScreenSettings } from 'src/app/misc/utils'
import * as ErrorCodes from 'src/constants/errorCodes'
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
	series: StoreBookSeries = new StoreBookSeries(null, this.apiService, this.cachingService)
	books: StoreBook[] = []
	selectableBooks: StoreBook[] = []
	editNameDialogVisible: boolean = false
	editNameDialogLoading: boolean = false
	editNameDialogName: string = ""
	editNameDialogNameError: string = ""
	addBookDialogVisible: boolean = false
	backButtonLink: string = ""
	addButtonHover: boolean = false
	dragging: boolean = false
	contextMenuVisible: boolean = false
	contextMenuPositionX: number = 0
	contextMenuPositionY: number = 0
	contextMenuBook: StoreBook

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private cachingService: CachingService,
		private routingService: RoutingService,
		private router: Router,
		private activatedRoute: ActivatedRoute,
		private dragulaService: DragulaService
	) {
		this.locale = this.dataService.GetLocale().authorSeriesPage

		// Check if this is a dual-screen device with a vertical fold
		let dualScreenSettings = GetDualScreenSettings()
		this.dualScreenLayout = dualScreenSettings.dualScreenLayout
		this.dualScreenFoldMargin = dualScreenSettings.dualScreenFoldMargin

		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid')

		this.dragulaService.drag("books").subscribe(() => this.dragging = true)
		this.dragulaService.dragend("books").subscribe(() => this.dragging = false)
	}

	async ngOnInit() {
		// Wait for the user to be loaded
		await this.dataService.userPromiseHolder.AwaitResult()
		await this.dataService.userAuthorPromiseHolder.AwaitResult()
		await this.dataService.adminAuthorsPromiseHolder.AwaitResult()

		if (this.dataService.userIsAdmin) {
			// Find the series in the collections of the authors of the user
			for (let author of this.dataService.adminAuthors) {
				let series = (await author.GetSeries()).find(s => s.uuid == this.uuid)

				if (series != null) {
					this.series = series
					this.author = author
					break
				}
			}
		} else if (this.dataService.userAuthor != null) {
			this.author = this.dataService.userAuthor

			let series = (await this.dataService.userAuthor.GetSeries()).find(s => s.uuid == this.uuid)
			if (series != null) this.series = series
		}

		if (this.series == null) {
			// Redirect back to the author profile
			this.routingService.NavigateBack("/author")
		}

		// Set the back button link
		this.backButtonLink = this.dataService.userIsAdmin ? `/author/${this.author.uuid}` : `/author`

		// Get the books of the series
		for (let storeBook of await this.series.GetStoreBooks()) {
			this.books.push(storeBook)
		}

		// Load the books for the add book dialog
		this.LoadSelectableBooks()
	}

	BackButtonClick() {
		this.router.navigate([this.backButtonLink])
	}

	async LoadSelectableBooks() {
		this.selectableBooks = []

		// Get the available books
		for (let collection of await this.author.GetCollections()) {
			for (let book of await collection.GetStoreBooks()) {
				if (
					this.books.findIndex(b => b.uuid == book.uuid) == -1
					&& book.status > 0
					&& book.cover.url != null
					&& book.language == this.series.language
				) this.selectableBooks.push(book)
			}
		}
	}

	ShowEditNameDialog() {
		this.editNameDialogName = this.series.name
		this.editNameDialogNameError = ""
		this.editNameDialogLoading = false
		this.editNameDialogVisible = true
	}

	async UpdateName() {
		this.editNameDialogLoading = true

		let updateNameResponse = await this.apiService.UpdateStoreBookSeries({
			uuid: this.uuid,
			name: this.editNameDialogName
		})

		this.editNameDialogLoading = false

		if (isSuccessStatusCode(updateNameResponse.status)) {
			this.editNameDialogVisible = false
			this.series.name = this.editNameDialogName
		} else {
			let errorCode = (updateNameResponse as ApiErrorResponse).errors[0].code

			switch (errorCode) {
				case ErrorCodes.NameTooShort:
					this.editNameDialogNameError = this.locale.errors.nameTooShort
					break
				case ErrorCodes.NameTooLong:
					this.editNameDialogNameError = this.locale.errors.nameTooLong
					break
				default:
					this.editNameDialogNameError = this.locale.errors.unexpectedError
					break
			}
		}
	}

	async AddBook(book: StoreBook) {
		// Add the selected book
		this.books.push(book)

		// Get the uuids of the store books
		let storeBookUuids = []

		for (let storeBook of this.books) {
			storeBookUuids.push(storeBook.uuid)
		}

		// Save the new collection order
		let response = await this.apiService.UpdateStoreBookSeries({
			uuid: this.uuid,
			storeBooks: storeBookUuids
		})

		if (isSuccessStatusCode(response.status)) {
			this.addBookDialogVisible = false

			this.author.ClearSeries()
			this.series.ClearStoreBooks()
			this.LoadSelectableBooks()
		}
	}

	async BooksReordered(books: StoreBook[]) {
		this.books = books
		let storeBookUuids = []

		for (let storeBook of this.books) {
			storeBookUuids.push(storeBook.uuid)
		}

		// Save the new store book order
		let response = await this.apiService.UpdateStoreBookSeries({
			uuid: this.uuid,
			storeBooks: storeBookUuids
		})

		if (isSuccessStatusCode(response.status)) {
			this.author.ClearSeries()
			this.series.ClearStoreBooks()
		}
	}

	async RemoveBook() {
		if (this.contextMenuBook == null) return

		// Remove the selected book
		let i = this.books.findIndex(b => b.uuid == this.contextMenuBook.uuid)

		if (i == -1) {
			return
		} else {
			this.books.splice(i, 1)
		}

		let storeBookUuids = []

		for (let storeBook of this.books) {
			storeBookUuids.push(storeBook.uuid)
		}

		// Save the new store book order
		let response = await this.apiService.UpdateStoreBookSeries({
			uuid: this.uuid,
			storeBooks: storeBookUuids
		})

		if (isSuccessStatusCode(response.status)) {
			this.author.ClearSeries()
			this.series.ClearStoreBooks()
			this.LoadSelectableBooks()
		}
	}

	async ShowBookContextMenu(event: PointerEvent, book: StoreBook) {
		event.preventDefault()
		this.contextMenuBook = book

		// Set the position of the context menu
		this.contextMenuPositionX = event.pageX
		this.contextMenuPositionY = event.pageY
		
		if (this.contextMenuVisible) {
			this.contextMenuVisible = false

			await new Promise((resolve: Function) => {
				setTimeout(() => resolve(), 60)
			})
		}

		this.contextMenuVisible = true
	}
}