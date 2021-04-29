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
	@Output() click = new EventEmitter()
	@Output() contextMenu = new EventEmitter()
	hovered: boolean = false
	cover: string = ""

	constructor(
		public dataService: DataService
	) { }

	ngOnInit() {
		if (this.book instanceof EpubBook && this.book.cover != null) {
			this.cover = this.book.cover
		} else {
			this.cover = this.dataService.defaultStoreBookCover
		}
	}

	Click() {
		this.click.emit()
	}

	ContextMenu(event: MouseEvent) {
		this.contextMenu.emit(event)
		return false
	}
}