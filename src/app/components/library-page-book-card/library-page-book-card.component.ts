import { Component, Input, Output, EventEmitter } from '@angular/core'
import { EpubBook } from 'src/app/models/EpubBook'
import { PdfBook } from 'src/app/models/PdfBook'
import { DataService } from 'src/app/services/data-service'

@Component({
	selector: 'pocketlib-library-page-book-card',
	templateUrl: './library-page-book-card.component.html'
})
export class LibraryPageBookCardComponent {
	@Input() book: EpubBook | PdfBook = new EpubBook(null, null, true, null)
	@Input() width: number = 180
	@Output() click = new EventEmitter()
	@Output() contextMenu = new EventEmitter()
	hovered: boolean = false
	cover: string = ""
	alt: string = ""
	showDefaultCover: boolean = false

	constructor(
		public dataService: DataService
	) { }

	ngOnInit() {
		if (this.book instanceof EpubBook && this.book.cover != null) {
			this.cover = this.book.cover
			this.showDefaultCover = false
		} else {
			this.cover = this.dataService.defaultStoreBookCover
			this.showDefaultCover = true
		}

		this.alt = this.dataService.GetLocale().misc.bookCoverAlt.replace('{0}', this.book.title)
	}

	ContextMenu(event: MouseEvent) {
		this.contextMenu.emit(event)
		return false
	}
}