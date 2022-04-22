import { Component, HostListener, ViewChild, ElementRef } from '@angular/core'
import { Router } from '@angular/router'
import { ReadFile } from 'ngx-file-helpers'
import { faAddressCard } from '@fortawesome/pro-light-svg-icons'
import { Dav } from 'dav-js'
import { DataService } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { CachingService } from 'src/app/services/caching-service'
import { Book } from 'src/app/models/Book'
import { EpubBook } from 'src/app/models/EpubBook'
import { PdfBook } from 'src/app/models/PdfBook'
import { GetBook } from 'src/app/models/BookManager'
import { UpdateBookOrder } from 'src/app/models/BookOrder'
import { environment } from 'src/environments/environment'
import { GetDualScreenSettings } from 'src/app/misc/utils'
import { enUS } from 'src/locales/locales'

const pdfType = "application/pdf"

@Component({
	templateUrl: "./library-page.component.html"
})
export class LibraryPageComponent {
	locale = enUS.libraryPage
	faAddressCard = faAddressCard
	@ViewChild('leftContentContainer') leftContentContainer: ElementRef<HTMLDivElement>
	@ViewChild('rightContentContainer') rightContentContainer: ElementRef<HTMLDivElement>
	contextMenuVisible: boolean = false
	contextMenuPositionX: number = 0
	contextMenuPositionY: number = 0
	smallBookList: boolean = false
	smallBookListWidth: number = 200
	largeBookCoverWidth: number = 300
	smallBookCoverWidth: number = 150
	selectedBook: Book
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	showRenameBookOption: boolean = false		// If the option in the context menu to rename the book is visible. Only for PdfBook
	showExportBookOption: boolean = false		// If the option in the context menu to export the book is visible
	renameBookDialogVisible: boolean = false
	renameBookDialogTitle: string = ""
	renameBookDialogError: string = ""
	removeBookDialogVisible: boolean = false
	loginToAccessBookDialogVisible: boolean = false
	addBookErrorDialogVisible: boolean = false
	addBookHover: boolean = false
	discoverBooksHover: boolean = false
	goToAuthorPageHover: boolean = false
	loading: boolean = true
	loadingScreenVisible: boolean = false
	allBooksVisible: boolean = false
	allBooks: Book[] = []
	allBooksHoveredIndex: number = -1
	smallCardsWidth: number = 140

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private cachingService: CachingService,
		private router: Router
	) {
		this.locale = this.dataService.GetLocale().libraryPage
		this.dataService.navbarVisible = true

		// Check if this is a dual-screen device with a vertical fold
		let dualScreenSettings = GetDualScreenSettings()
		this.dualScreenLayout = dualScreenSettings.dualScreenLayout
		this.dualScreenFoldMargin = dualScreenSettings.dualScreenFoldMargin
	}

	async ngOnInit() {
		await this.dataService.allBooksInitialLoadPromiseHolder.AwaitResult()
		this.loading = false

		this.setSize()
	}

	ngAfterViewInit() {
		this.setSize()
	}

	ngAfterViewChecked() {
		if (this.allBooksVisible && this.leftContentContainer != null) {
			this.leftContentContainer.nativeElement.style.transform = `translateX(-${window.innerWidth}px)`
		} else if (!this.allBooksVisible && this.rightContentContainer != null) {
			this.rightContentContainer.nativeElement.style.transform = `translateX(${window.innerWidth}px)`
		}
	}

	@HostListener('window:resize')
	setSize() {
		this.smallBookList = window.innerWidth < 650

		if (this.smallBookList) {
			this.smallBookCoverWidth = (this.largeBookCoverWidth / 2) - 9
		} else {
			this.smallBookCoverWidth = (this.largeBookCoverWidth / 2) - 6
		}

		if (this.smallBookList) {
			this.smallBookListWidth = this.largeBookCoverWidth + 18
		} else if (this.dataService.books.length > 3) {
			this.smallBookListWidth = ((this.largeBookCoverWidth / 2) + 16) * 2
		} else if (this.dataService.books.length == 1) {
			this.smallBookListWidth = 0
		} else {
			this.smallBookListWidth = ((this.largeBookCoverWidth / 2) + 16)
		}

		if (window.innerWidth < 450) {
			this.smallCardsWidth = 100
		} else if (window.innerWidth < 550) {
			this.smallCardsWidth = 120
		} else {
			this.smallCardsWidth = 140
		}
	}

	async AddBookFilePick(file: ReadFile) {
		this.loadingScreenVisible = true
		let uuid: string = ""

		// Create a new book
		if (file.type == pdfType) {
			uuid = await PdfBook.Create(file.underlyingFile, file.name.slice(0, file.name.lastIndexOf('.')))
		} else {
			uuid = await EpubBook.Create(file.underlyingFile)
		}

		if (uuid == null) {
			// Show error dialog
			this.loadingScreenVisible = false
			this.addBookErrorDialogVisible = true
			return
		}

		await this.dataService.LoadAllBooks()

		// Get the created book and show it
		let book = this.dataService.books.find(b => b.uuid == uuid)
		if (book != null) this.ShowBook(book)
	}

	async ShowBook(book: Book) {
		// Check if the user can access the book
		if (book.storeBook && !this.dataService.dav.isLoggedIn) {
			this.loginToAccessBookDialogVisible = true
			return
		}

		this.dataService.currentBook = book

		// Update the settings with the position of the current book
		if (book instanceof EpubBook) {
			await this.dataService.settings.SetBook(book.uuid, book.chapter, book.progress)
		} else if (book instanceof PdfBook) {
			await this.dataService.settings.SetBook(book.uuid, null, book.page)
		}

		this.router.navigate(["book"])

		// Move the selected book to the top of the books list
		this.dataService.MoveBookToFirstPosition(book.uuid)

		// Update the order of the books
		await UpdateBookOrder(this.dataService.bookOrder, this.dataService.books)
	}

	async ShowAllBooks() {
		this.LoadAllBooksList()
		this.allBooksVisible = true

		this.rightContentContainer.nativeElement.classList.remove("d-none")
		await new Promise((r: Function) => setTimeout(r, 1))

		this.leftContentContainer.nativeElement.style.transform = `translateX(${-window.innerWidth}px)`
		this.rightContentContainer.nativeElement.style.transform = `translateX(0px)`
		await new Promise((r: Function) => setTimeout(r, 300))

		window.scrollTo(0, 0)
		await new Promise((r: Function) => setTimeout(r, 200))

		this.leftContentContainer.nativeElement.style.position = "absolute"
		this.rightContentContainer.nativeElement.style.position = "relative"
		this.leftContentContainer.nativeElement.classList.add("d-none")
	}

	async HideAllBooks() {
		this.allBooksVisible = false

		this.leftContentContainer.nativeElement.classList.remove("d-none")
		await new Promise((r: Function) => setTimeout(r, 1))

		this.leftContentContainer.nativeElement.style.transform = `translateX(0px)`
		this.rightContentContainer.nativeElement.style.transform = `translateX(${window.innerWidth}px)`
		await new Promise((r: Function) => setTimeout(r, 300))

		window.scrollTo(0, 0)
		await new Promise((r: Function) => setTimeout(r, 200))

		this.leftContentContainer.nativeElement.style.position = "relative"
		this.rightContentContainer.nativeElement.style.position = "absolute"
		this.rightContentContainer.nativeElement.classList.add("d-none")
	}

	LoadAllBooksList() {
		// Copy the books
		this.allBooks = []

		for (let book of this.dataService.books) {
			this.allBooks.push(book)
		}

		// Sort the books by name
		this.SortAllBooksByName()
	}

	SortAllBooksByName() {
		this.allBooks.sort((a: EpubBook | PdfBook, b: EpubBook | PdfBook) => {
			let firstTitle = a.title.toLowerCase()
			let secondTitle = b.title.toLowerCase()

			if (firstTitle > secondTitle) {
				return 1
			} else if (firstTitle < secondTitle) {
				return -1
			} else {
				return 0
			}
		})
	}

	async BookContextMenu(event: MouseEvent, book: Book) {
		event.preventDefault()

		this.selectedBook = book
		this.showRenameBookOption = book instanceof PdfBook && !book.storeBook
		this.showExportBookOption = book.belongsToUser || book.purchase != null

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

	async DownloadBook() {
		let link = document.createElement("a")
		link.download = (this.selectedBook as PdfBook | EpubBook).title
		link.href = URL.createObjectURL(this.selectedBook.file)
		link.click()
	}

	GoToLoginPage() {
		Dav.ShowLoginPage(environment.apiKey, environment.baseUrl)
	}

	ShowRenameBookDialog() {
		this.contextMenuVisible = false
		this.renameBookDialogTitle = (this.selectedBook as PdfBook).title
		this.renameBookDialogError = ""
		this.renameBookDialogVisible = true
	}

	ShowRemoveBookDialog() {
		this.contextMenuVisible = false
		this.removeBookDialogVisible = true
	}

	async RenameBook() {
		this.renameBookDialogError = ""

		if (this.renameBookDialogTitle.length == 0) {
			this.renameBookDialogError = this.locale.renameBookDialog.errors.titleMissing
		} else if (this.renameBookDialogTitle.length < 2) {
			this.renameBookDialogError = this.locale.renameBookDialog.errors.titleTooShort
		} else if (this.renameBookDialogTitle.length > 50) {
			this.renameBookDialogError = this.locale.renameBookDialog.errors.titleTooLong
		} else {
			await (this.selectedBook as PdfBook).SetTitle(this.renameBookDialogTitle)
			this.renameBookDialogVisible = false
		}
	}

	async RemoveBook() {
		this.removeBookDialogVisible = false
		await this.selectedBook.Delete()
		await this.dataService.LoadAllBooks()

		if (this.allBooksVisible) {
			this.LoadAllBooksList()
		}

		// Update the order of the books
		await UpdateBookOrder(this.dataService.bookOrder, this.dataService.books)

		// Clear the ApiCache for GetStoreBook
		this.cachingService.ClearApiRequestCache(this.apiService.RetrieveStoreBook.name)
	}

	SearchTextChange(value: string) {
		if (value.length == 0) {
			// Show all books
			this.LoadAllBooksList()
		} else {
			this.allBooks = []

			// Find all books, which include the search value in the title
			for (let book of this.dataService.books) {
				if ((book as EpubBook | PdfBook).title.toLowerCase().includes(value.toLowerCase().trim())) {
					this.allBooks.push(book)
				}
			}

			// Sort the books by name
			this.SortAllBooksByName()
		}
	}
}