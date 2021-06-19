import { Component, ViewChild, ElementRef } from '@angular/core'
import { Router } from '@angular/router'
import { IDialogContentProps, IButtonStyles, SpinnerSize } from 'office-ui-fabric-react'
import { ReadFile } from 'ngx-file-helpers'
import { faAddressCard } from '@fortawesome/pro-light-svg-icons'
import { DataService } from 'src/app/services/data-service'
import { Book } from 'src/app/models/Book'
import { EpubBook } from 'src/app/models/EpubBook'
import { PdfBook } from 'src/app/models/PdfBook'
import { GetDualScreenSettings, UpdateDialogForDualScreenLayout } from 'src/app/misc/utils'
import { enUS } from 'src/locales/locales'

const pdfType = "application/pdf"

@Component({
	templateUrl: "./library-page.component.html"
})
export class LibraryPageComponent {
	locale = enUS.libraryPage
	@ViewChild('contextMenu', { static: true }) contextMenu: ElementRef
	faAddressCard = faAddressCard
	contextMenuVisible: boolean = false
	contextMenuPositionX: number = 0
	contextMenuPositionY: number = 0
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
	spinnerSize: SpinnerSize = SpinnerSize.large

	renameBookDialogContentProps: IDialogContentProps = {
		title: this.locale.renameBookDialog.title
	}
	removeBookDialogContentProps: IDialogContentProps = {
		title: this.locale.removeBookDialog.title
	}
	loginToAccessBookDialogContentProps: IDialogContentProps = {
		title: this.locale.loginToAccessBookDialog.title
	}
	addBookErrorDialogContentProps: IDialogContentProps = {
		title: this.locale.addBookErrorDialog.title
	}
	dialogPrimaryButtonStyles: IButtonStyles = {
		root: {
			marginLeft: 10
		}
	}
	removeBookDialogPrimaryButtonStyles: IButtonStyles = {
		root: {
			marginLeft: 10,
			backgroundColor: "#dc3545"
		},
		rootHovered: {
			backgroundColor: "#c82333"
		},
		rootPressed: {
			backgroundColor: "#c82333"
		}
	}

	constructor(
		public dataService: DataService,
		private router: Router
	) {
		this.locale = this.dataService.GetLocale().libraryPage
		this.dataService.navbarVisible = true

		// Check if this is a dual-screen device with a vertical fold
		let dualScreenSettings = GetDualScreenSettings()
		this.dualScreenLayout = dualScreenSettings.dualScreenLayout
		this.dualScreenFoldMargin = dualScreenSettings.dualScreenFoldMargin

		document.onclick = (event: MouseEvent) => {
			if (!this.contextMenuVisible) return

			let target = event.target as Node
			let contextMenu = this.contextMenu.nativeElement as HTMLDivElement

			if (!contextMenu.contains(target)) {
				// Hide the context menu
				this.contextMenuVisible = false
			}
		}
	}

	async ngOnInit() {
		await this.dataService.allBooksInitialLoadPromiseHolder.AwaitResult()
		this.loading = false
	}

	async AddBookFilePick(file: ReadFile) {
		// Create a new book
		if (file.type == pdfType) {
			await PdfBook.Create(file.underlyingFile, file.name.slice(0, file.name.lastIndexOf('.')))
		} else {
			let uuid = await EpubBook.Create(file.underlyingFile)

			if (uuid == null) {
				// Show error dialog
				this.addBookErrorDialogContentProps.title = this.locale.addBookErrorDialog.title
				this.addBookErrorDialogVisible = true
				return
			}
		}

		await this.dataService.LoadAllBooks()
	}

	async ShowBook(book: Book) {
		// Check if the user can access the book
		if (book.storeBook && !this.dataService.dav.isLoggedIn) {
			this.loginToAccessBookDialogContentProps.title = this.locale.loginToAccessBookDialog.title
			this.loginToAccessBookDialogVisible = true

			if (this.dualScreenLayout) {
				UpdateDialogForDualScreenLayout()
			}
			return
		}

		this.dataService.currentBook = book

		// Update the settings with the position of the current book
		if (this.dataService.currentBook instanceof EpubBook) {
			await this.dataService.settings.SetBook(book.uuid, this.dataService.currentBook.chapter, this.dataService.currentBook.progress)
		} else if (this.dataService.currentBook instanceof PdfBook) {
			await this.dataService.settings.SetBook(book.uuid, null, this.dataService.currentBook.page)
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
				setTimeout(() => {
					resolve()
				}, 60)
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

	ShowRenameBookDialog() {
		this.contextMenuVisible = false
		this.renameBookDialogTitle = (this.selectedBook as PdfBook).title
		this.renameBookDialogError = ""

		this.renameBookDialogContentProps.title = this.locale.renameBookDialog.title
		this.renameBookDialogVisible = true

		if (this.dualScreenLayout) {
			UpdateDialogForDualScreenLayout()
		}
	}

	ShowRemoveBookDialog() {
		this.contextMenuVisible = false
		this.removeBookDialogContentProps.title = this.locale.removeBookDialog.title
		this.removeBookDialogVisible = true

		if (this.dualScreenLayout) {
			UpdateDialogForDualScreenLayout()
		}
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
	}
}