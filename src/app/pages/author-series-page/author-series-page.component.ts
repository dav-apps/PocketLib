import { Component, ViewChild, ElementRef, HostListener } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { faTrashCan as faTrashCanLight } from "@fortawesome/pro-light-svg-icons"
import { ContextMenu } from "dav-ui-components"
import { EditNameDialogComponent } from "src/app/components/dialogs/edit-name-dialog/edit-name-dialog.component"
import { AddBookDialogComponent } from "src/app/components/dialogs/add-book-dialog/add-book-dialog.component"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { LocalizationService } from "src/app/services/localization-service"
import { SettingsService } from "src/app/services/settings-service"
import { Author } from "src/app/models/Author"
import { StoreBookSeries } from "src/app/models/StoreBookSeries"
import { StoreBook } from "src/app/models/StoreBook"
import * as ErrorCodes from "src/constants/errorCodes"

interface StoreBookItem {
	uuid: string
	title: string
	blurhash: string
	coverContent: string
}

@Component({
	selector: "pocketlib-author-series-page",
	templateUrl: "./author-series-page.component.html",
	styleUrl: "./author-series-page.component.scss",
	standalone: false
})
export class AuthorSeriesPageComponent {
	locale = this.localizationService.locale.authorSeriesPage
	faTrashCanLight = faTrashCanLight
	@ViewChild("editNameDialog")
	editNameDialog: EditNameDialogComponent
	@ViewChild("addBookDialog")
	addBookDialog: AddBookDialogComponent
	@ViewChild("contextMenu")
	contextMenu: ElementRef<ContextMenu>
	uuid: string = ""
	author: Author
	series: StoreBookSeries = new StoreBookSeries(null, [], this.apiService)
	books: StoreBookItem[] = []
	selectableBooks: StoreBookItem[] = []
	editNameDialogLoading: boolean = false
	editNameDialogName: string = ""
	editNameDialogNameError: string = ""
	dragging: boolean = false
	contextMenuVisible: boolean = false
	contextMenuPositionX: number = 0
	contextMenuPositionY: number = 0
	contextMenuBook: StoreBookItem

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private localizationService: LocalizationService,
		private settingsService: SettingsService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.dataService.setMeta()
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
					await this.settingsService.getStoreLanguages(),
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

	@HostListener("document:click", ["$event"])
	documentClick(event: MouseEvent) {
		if (!this.contextMenu.nativeElement.contains(event.target as Node)) {
			this.contextMenuVisible = false
		}
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
		this.editNameDialog.show()
	}

	async UpdateName(result: { name: string }) {
		this.editNameDialogLoading = true

		let updateSeriesResponse = await this.apiService.updateStoreBookSeries(
			`uuid`,
			{
				uuid: this.uuid,
				name: result.name
			}
		)

		this.editNameDialogLoading = false

		if (updateSeriesResponse.errors == null) {
			this.editNameDialog.hide()
			this.series.name = result.name
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
			this.addBookDialog.hide()

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
		this.contextMenuVisible = false

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
