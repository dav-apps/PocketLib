import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { DataService } from 'src/app/services/data-service'
import { Portal, ComponentPortal } from '@angular/cdk/portal'
import { EpubContentComponent } from 'src/app/components/epub-content/epub-content.component'
import { PdfContentComponent } from 'src/app/components/pdf-content/pdf-content.component'
import { GetBook } from 'src/app/models/BookManager'

const epubType = "application/epub+zip"
const pdfType = "application/pdf"

@Component({
	selector: "pocketlib-book-page",
	templateUrl: "./book-page.component.html"
})
export class BookPageComponent {
	selectedPortal: Portal<any>

	constructor(
		public dataService: DataService,
		private router: Router
	) {
		this.dataService.navbarVisible = false
	}

	async ngOnInit() {
		// Navigate to the loading screen if there is no currentBook
		if (!this.dataService.currentBook) {
			this.router.navigate(['loading'], { skipLocationChange: true })
			return
		}

		// Disable scrolling and min-height of root
		document.body.setAttribute('style', 'overflow: hidden')
		document.getElementById('root').style.minHeight = null

		if (!this.dataService.currentBook && this.dataService.settings.book) {
			// Get the current book from the settings
			this.dataService.currentBook = await GetBook(this.dataService.settings.book)
		}

		// Select the correct rendering component, based on the mime type of the file
		if (this.dataService.currentBook.file.type == epubType) {
			this.selectedPortal = new ComponentPortal(EpubContentComponent)
		} else if (this.dataService.currentBook.file.type == pdfType) {
			this.selectedPortal = new ComponentPortal(PdfContentComponent)
		}
	}

	ngOnDestroy() {
		document.body.removeAttribute('style')
		document.getElementById('root').style.minHeight = "100vh"
	}
}