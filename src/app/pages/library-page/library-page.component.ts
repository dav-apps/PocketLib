import { Component, HostListener } from '@angular/core'
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
	contextMenuVisible: boolean = false
	contextMenuPositionX: number = 0
	contextMenuPositionY: number = 0
	bookCoverWidth: number = 180
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
	}

	@HostListener('window:resize')
	setSize() {
		if (window.innerWidth > 400) {
			this.bookCoverWidth = 180
		} else if (window.innerWidth > 360) {
			this.bookCoverWidth = 160
		} else {
			this.bookCoverWidth = 140
		}
	}

	async AddBookFilePick(file: ReadFile) {
		// Create a new book
		if (file.type == pdfType) {
			await PdfBook.Create(file.underlyingFile, file.name.slice(0, file.name.lastIndexOf('.')))
		} else {
			let uuid = await EpubBook.Create(file.underlyingFile)

			if (uuid == null) {
				// Show error dialog
				this.addBookErrorDialogVisible = true
				return
			}
		}

		await this.dataService.LoadAllBooks()
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
	}

	async BookContextMenu(event: MouseEvent, book: Book) {
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

		// Clear the ApiCache for GetStoreBook
		this.cachingService.ClearApiRequestCache(this.apiService.GetStoreBook.name)
	}
}