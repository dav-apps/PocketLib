import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { DragulaService } from 'ng2-dragula'
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
	selectableBooks: StoreBook[] = []
	seriesName: { name: string, language: string } = { name: "", language: "" }
	seriesNames: { name: string, language: string, fullLanguage: string, edit: boolean }[] = []
	namesDialogVisible: boolean = false
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
		private routingService: RoutingService,
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

		// Load the books for the add book dialog
		this.LoadSelectableBooks()
	}

	LoadSelectableBooks() {
		this.selectableBooks = []

		// Get the available books
		for (let collection of this.author.collections) {
			for (let book of collection.books) {
				if (
					this.books.findIndex(b => b.uuid == book.uuid) == -1
					&& book.status > 0
					&& book.language == this.dataService.supportedLocale
				) this.selectableBooks.push(book)
			}
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

				// Update the title if the name for the current language was added
				let j = FindAppropriateLanguage(this.dataService.supportedLocale, this.series.names)
				if (j != -1) this.seriesName = this.series.names[j]
			} else {
				// Update the name in the series
				this.series.names[i].name = seriesName.name
			}
		}
	}

	async AddBook(book: StoreBook) {
		let collectionUuids: string[] = []

		// Get the collection uuids of the books
		for (let book of this.books) {
			let collection = this.author.collections.find(c => c.books.findIndex(b => b.uuid == book.uuid) != -1)
			if (collection != null) collectionUuids.push(collection.uuid)
		}

		// Get the collection uuid of the selected book
		let selectedBookCollection = this.author.collections.find(c => c.books.findIndex(b => b.uuid == book.uuid) != -1)
		if (selectedBookCollection == null) return

		// Add the collection uuid of the selected book
		collectionUuids.push(selectedBookCollection.uuid)

		// Save the new collection order
		let response = await this.apiService.UpdateStoreBookSeries({
			uuid: this.uuid,
			collections: collectionUuids
		})

		if (response.status == 200) {
			this.books.push(book)
			this.addBookDialogVisible = false
			this.LoadSelectableBooks()
		}
	}

	async BooksReordered(books: StoreBook[]) {
		this.books = books
		let collectionUuids: string[] = []

		// Get the collection uuids of the books
		for (let book of this.books) {
			let collection = this.author.collections.find(c => c.books.findIndex(b => b.uuid == book.uuid) != -1)
			if (collection != null) collectionUuids.push(collection.uuid)
		}

		// Save the new collection order
		await this.apiService.UpdateStoreBookSeries({
			uuid: this.uuid,
			collections: collectionUuids
		})
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

	async RemoveBook() {
		if (this.contextMenuBook == null) return
		let collectionUuids: string[] = []

		// Get the collection uuid of the selected book
		let selectedBookCollection = this.author.collections.find(c => c.books.findIndex(b => b.uuid == this.contextMenuBook.uuid) != -1)
		if (selectedBookCollection == null) return

		// Get the collection uuids of the books, except the selected one
		for (let book of this.books) {
			let collection = this.author.collections.find(c => c.books.findIndex(b => b.uuid == book.uuid) != -1)

			if (
				collection != null
				&& collection.uuid != selectedBookCollection.uuid
			) collectionUuids.push(collection.uuid)
		}

		// Save the new collection order
		let response = await this.apiService.UpdateStoreBookSeries({
			uuid: this.uuid,
			collections: collectionUuids
		})

		if (response.status == 200) {
			// Remove the selected book from the books
			let i = this.books.findIndex(b => b.uuid == this.contextMenuBook.uuid)
			if (i != -1) this.books.splice(i, 1)

			this.LoadSelectableBooks()
		}
	}
}