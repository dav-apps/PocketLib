import { Component } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { DragulaService } from "ng2-dragula"
import { faTrashCan as faTrashCanLight } from "@fortawesome/pro-light-svg-icons"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { Author } from "src/app/models/Author"
import { StoreBookSeries } from "src/app/models/StoreBookSeries"
import { StoreBook } from "src/app/models/StoreBook"
import * as ErrorCodes from "src/constants/errorCodes"
import { enUS } from "src/locales/locales"

interface StoreBookItem {
	uuid: string
	title: string
	blurhash: string
	coverContent: string
}

@Component({
	selector: "pocketlib-author-series-page",
	templateUrl: "./author-series-page.component.html",
	styleUrls: ["./author-series-page.component.scss"]
})
export class AuthorSeriesPageComponent {
	locale = enUS.authorSeriesPage
	faTrashCanLight = faTrashCanLight
	uuid: string = ""
	author: Author
	series: StoreBookSeries = new StoreBookSeries(
		null,
		this.dataService,
		this.apiService
	)
	books: StoreBookItem[] = []
	selectableBooks: StoreBookItem[] = []
	editNameDialogVisible: boolean = false
	editNameDialogLoading: boolean = false
	editNameDialogName: string = ""
	editNameDialogNameError: string = ""
	addBookDialogVisible: boolean = false
	dragging: boolean = false
	contextMenuVisible: boolean = false
	contextMenuPositionX: number = 0
	contextMenuPositionY: number = 0
	contextMenuBook: StoreBookItem

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private router: Router,
		private activatedRoute: ActivatedRoute,
		private dragulaService: DragulaService
	) {
		this.locale = this.dataService.GetLocale().authorSeriesPage

		this.dragulaService.drag("books").subscribe(() => (this.dragging = true))
		this.dragulaService
			.dragend("books")
			.subscribe(() => (this.dragging = false))
	}

	async ngOnInit() {
		// Wait for the user to be loaded
		await this.dataService.userPromiseHolder.AwaitResult()
		await this.dataService.userAuthorPromiseHolder.AwaitResult()
		await this.dataService.adminAuthorsPromiseHolder.AwaitResult()

		if (this.dataService.userIsAdmin) {
			// Get the author
			let authorUuid =
				this.activatedRoute.snapshot.paramMap.get("author_uuid")
			this.author = this.dataService.adminAuthors.find(
				a => a.uuid == authorUuid
			)

			if (this.author == null) {
				this.author = await Author.Retrieve(
					authorUuid,
					this.dataService,
					this.apiService
				)
			}
		} else if (this.dataService.userAuthor) {
			this.author = this.dataService.userAuthor
		}

		if (this.author == null) {
			this.router.navigate(["author"])
			return
		}

		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get("series_uuid")

		// Get the series
		let seriesResult = await this.author.GetSeries()
		this.series = seriesResult.items.find(s => s.uuid == this.uuid)

		if (this.series == null) {
			this.router.navigate(["author"])
			return
		}

		// Get the books of the series
		let storeBooksResult = await this.series.GetStoreBooks()

		for (let storeBook of storeBooksResult.items) {
			this.books.push({
				uuid: storeBook.uuid,
				title: storeBook.title,
				blurhash: storeBook.cover?.blurhash,
				coverContent: storeBook.cover?.url
			})
		}

		// Load the books for the add book dialog
		this.LoadSelectableBooks()
	}

	BackButtonClick() {
		if (this.dataService.userIsAdmin) {
			this.router.navigate(["author", this.author.uuid])
		} else {
			this.router.navigate(["author"])
		}
	}

	async LoadSelectableBooks() {
		this.selectableBooks = []

		// Get the available books
		let collectionsResult = await this.author.GetCollections()

		for (let collection of collectionsResult.items) {
			let storeBooksResult = await collection.GetStoreBooks()

			for (let book of storeBooksResult.items) {
				if (
					this.books.findIndex(b => b.uuid == book.uuid) == -1 &&
					book.status > 0 &&
					book.cover.url != null &&
					book.language == this.series.language
				) {
					this.selectableBooks.push({
						uuid: book.uuid,
						title: book.title,
						blurhash: book.cover?.blurhash,
						coverContent: book.cover?.url
					})
				}
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

		let updateSeriesResponse = await this.apiService.updateStoreBookSeries(
			`uuid`,
			{
				uuid: this.uuid,
				name: this.editNameDialogName
			}
		)

		this.editNameDialogLoading = false

		if (updateSeriesResponse.errors == null) {
			this.editNameDialogVisible = false
			this.series.name = this.editNameDialogName
		} else {
			let errors = updateSeriesResponse.errors[0].extensions
				.errors as string[]

			switch (errors[0]) {
				case ErrorCodes.nameTooShort:
					this.editNameDialogNameError = this.locale.errors.nameTooShort
					break
				case ErrorCodes.nameTooLong:
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
		this.books.push({
			uuid: book.uuid,
			title: book.title,
			blurhash: book.cover?.blurhash,
			coverContent: book.cover?.url
		})

		// Get the uuids of the store books
		let storeBookUuids = []

		for (let storeBook of this.books) {
			storeBookUuids.push(storeBook.uuid)
		}

		// Save the new collection order
		let response = await this.apiService.updateStoreBookSeries(`uuid`, {
			uuid: this.uuid,
			storeBooks: storeBookUuids
		})

		if (response.errors == null) {
			this.addBookDialogVisible = false

			//this.author.ClearSeries()
			//this.series.ClearStoreBooks()
			this.LoadSelectableBooks()
		}
	}

	async BooksReordered(books: StoreBookItem[]) {
		this.books = books
		let storeBookUuids = []

		for (let storeBook of this.books) {
			storeBookUuids.push(storeBook.uuid)
		}

		// Save the new store book order
		let response = await this.apiService.updateStoreBookSeries(`uuid`, {
			uuid: this.uuid,
			storeBooks: storeBookUuids
		})

		if (response.errors == null) {
			//this.author.ClearSeries()
			//this.series.ClearStoreBooks()
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
		let response = await this.apiService.updateStoreBookSeries(`uuid`, {
			uuid: this.uuid,
			storeBooks: storeBookUuids
		})

		if (response.errors == null) {
			//this.author.ClearSeries()
			//this.series.ClearStoreBooks()
			this.LoadSelectableBooks()
		}
	}

	async ShowBookContextMenu(event: PointerEvent, book: StoreBookItem) {
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
