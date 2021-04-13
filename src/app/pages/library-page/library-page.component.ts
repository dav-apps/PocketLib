import { Component, ViewChild, ElementRef } from "@angular/core"
import { Router } from '@angular/router'
import { transition, trigger, state, style, animate } from '@angular/animations'
import { IDialogContentProps, IButtonStyles } from 'office-ui-fabric-react'
import { ReadFile } from 'ngx-file-helpers'
import { enUS } from 'src/locales/locales'
import { DataService } from 'src/app/services/data-service'
import { Book } from 'src/app/models/Book'
import { EpubBook } from 'src/app/models/EpubBook'
import { PdfBook } from 'src/app/models/PdfBook'

const pdfType = "application/pdf"

@Component({
	selector: "pocketlib-library-page",
	templateUrl: "./library-page.component.html",
	animations: [
		trigger('addBookHover', [
			state('false', style({
				transform: 'rotateZ(0deg)',
				fontSize: '22px'
			})),
			state('true', style({
				transform: 'rotateZ(90deg)',
				fontSize: '28px'
			})),
			transition('true => false', [
				animate('0.18s ease-in')
			]),
			transition('false => true', [
				animate('0.18s ease-out')
			])
		])
	]
})
export class LibraryPageComponent {
	locale = enUS.libraryPage
	@ViewChild('contextMenu', { static: true }) contextMenu: ElementRef
	contextMenuVisible: boolean = false
	contextMenuPositionX: number = 0
	contextMenuPositionY: number = 0
	selectedBook: Book
	showRenameBookOption: boolean = false		// If the option in the context menu to rename the book is visible. Only for PdfBook
	showExportBookOption: boolean = false		// If the option in the context menu to export the book is visible
	hoveredBookIndex: number = -1					// The currently hovered book, for showing the shadow
	discoverBooksHover: boolean = false			// Indicator for if the mouse is hovering the discover books card
	addBookHover: boolean = false					// Indicator for if the mouse is hovering the add book card
	goToAuthorPageHover: boolean = false		// Indicator for if the mouse is hovering the card for going to the author page
	renameBookDialogVisible: boolean = false
	renameBookDialogTitle: string = ""
	renameBookDialogError: string = ""
	removeBookDialogVisible: boolean = false
	loginToAccessBookDialogVisible: boolean = false

	renameBookDialogContentProps: IDialogContentProps = {
		title: this.locale.renameBookDialog.title
	}
	removeBookDialogContentProps: IDialogContentProps = {
		title: this.locale.removeBookDialog.title
	}
	loginToAccessBookDialogContentProps: IDialogContentProps = {
		title: this.locale.loginToAccessBookDialog.title
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

	async filePick(file: ReadFile) {
		// Create a new book
		if (file.type == pdfType) {
			await PdfBook.Create(file.underlyingFile, file.name.slice(0, file.name.lastIndexOf('.')))
		} else {
			await EpubBook.Create(file.underlyingFile)
		}
		await this.dataService.LoadAllBooks()
	}

	NavigateToStorePage() {
		this.router.navigate(['store'])
	}

	NavigateToAuthorPage() {
		this.router.navigate(['author'])
	}

	async ShowBook(book: Book) {
		// Check if the user can access the book
		if (book.storeBook && !this.dataService.dav.isLoggedIn) {
			this.loginToAccessBookDialogContentProps.title = this.locale.loginToAccessBookDialog.title
			this.loginToAccessBookDialogVisible = true
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

	onContextMenu(event: MouseEvent, book: Book) {
		this.selectedBook = book
		this.showRenameBookOption = book instanceof PdfBook && !book.storeBook
		this.showExportBookOption = book.belongsToUser || book.purchase != null

		// Set the position of the context menu
		this.contextMenuPositionX = event.pageX
		this.contextMenuPositionY = event.pageY

		if (this.contextMenuVisible) {
			this.contextMenuVisible = false
			setTimeout(() => {
				this.contextMenuVisible = true
			}, 60)
		} else {
			this.contextMenuVisible = true
		}
		return false
	}

	ShowRenameBookDialog() {
		this.contextMenuVisible = false
		this.renameBookDialogTitle = (this.selectedBook as PdfBook).title
		this.renameBookDialogError = ""

		this.renameBookDialogContentProps.title = this.locale.renameBookDialog.title
		this.renameBookDialogVisible = true
	}

	ShowRemoveBookDialog() {
		this.contextMenuVisible = false
		this.removeBookDialogContentProps.title = this.locale.removeBookDialog.title
		this.removeBookDialogVisible = true
	}

	async RenameBook() {
		this.renameBookDialogError = ""

		if (this.renameBookDialogTitle.length == 0) {
			this.renameBookDialogError = this.locale.renameBookDialog.errors.titleMissing
		} else if (this.renameBookDialogTitle.length < 2) {
			this.renameBookDialogError = this.locale.renameBookDialog.errors.titleTooShort
		} else if (this.renameBookDialogTitle.length > 100) {
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