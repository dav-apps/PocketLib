import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core'
import { DataService } from 'src/app/services/data-service'
import { StoreBook } from 'src/app/misc/types'
import { enUS } from 'src/locales/locales'

interface BookItem {
	uuid: string
	title: string
	cover: string
	checked: boolean
}

@Component({
	selector: 'pocketlib-new-series-page-book-selection-section',
	templateUrl: './new-series-page-book-selection-section.component.html'
})
export class NewSeriesPageBookSelectionSectionComponent {
	locale = enUS.newSeriesPage
	@Input() section: number = 0
	@Input() visibleSection: number = 0
	@Input() forwardNavigation: boolean = false
	@Input() books: StoreBook[] = []
	@Output() selectedBooksChange = new EventEmitter()
	@Output() previous = new EventEmitter()
	@Output() finish = new EventEmitter()
	selectedBooks: BookItem[] = []

	constructor(
		public dataService: DataService
	) {
		this.locale = this.dataService.GetLocale().newSeriesPage
	}

	ngOnChanges() {
		for (let book of this.books) {
			let i = this.selectedBooks.findIndex(b => b.uuid == book.uuid)
			if (i != -1) continue

			this.selectedBooks.push({
				uuid: book.uuid,
				title: book.title,
				cover: book.coverContent,
				checked: false
			})
		}
	}

	ToggleSelectedBook(bookItem: BookItem) {
		bookItem.checked = !bookItem.checked
		let i = this.selectedBooks.findIndex(b => b.uuid == bookItem.uuid)

		if (i != -1) {
			this.selectedBooks[i].checked = bookItem.checked
		}

		// Get the uuids of the selected books
		let selectedBookUuids: string[] = []

		for (let book of this.selectedBooks) {
			if (book.checked) {
				selectedBookUuids.push(book.uuid)
			}
		}

		this.selectedBooksChange.emit(selectedBookUuids)
	}

	Previous() {
		this.previous.emit()
	}

	Finish() {
		this.finish.emit()
	}
}