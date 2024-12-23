import { Component } from "@angular/core"
import { Router } from "@angular/router"
import { DataService } from "src/app/services/data-service"
import { Portal, ComponentPortal } from "@angular/cdk/portal"
import { EpubViewerComponent } from "src/app/components/epub-viewer/epub-viewer.component"
import { PdfViewerComponent } from "src/app/components/pdf-viewer/pdf-viewer.component"
import { GetBook } from "src/app/models/BookManager"

const epubType = "application/epub+zip"
const pdfType = "application/pdf"

@Component({
	selector: "pocketlib-book-page",
	templateUrl: "./book-page.component.html",
	standalone: false
})
export class BookPageComponent {
	selectedPortal: Portal<any>

	constructor(
		public dataService: DataService,
		private router: Router
	) {
		this.dataService.navbarVisible = false
		this.dataService.bookPageVisible = true

		this.dataService.setMeta()
	}

	async ngOnInit() {
		// Navigate to the loading screen if there is no currentBook
		if (!this.dataService.currentBook) {
			this.router.navigate(["loading"], { skipLocationChange: true })
			return
		}

		if (!this.dataService.currentBook && this.dataService.settings.book) {
			// Get the current book from the settings
			this.dataService.currentBook = await GetBook(
				this.dataService.settings.book
			)
		}

		// Select the correct rendering component, based on the mime type of the file
		if (this.dataService.currentBook.file.type == epubType) {
			this.selectedPortal = new ComponentPortal(EpubViewerComponent)
		} else if (this.dataService.currentBook.file.type == pdfType) {
			this.selectedPortal = new ComponentPortal(PdfViewerComponent)
		}
	}
}
