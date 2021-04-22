import { Component, Output, EventEmitter } from '@angular/core'
import { ReadFile } from 'ngx-file-helpers'
import { DataService } from 'src/app/services/data-service'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-library-page-cards',
	templateUrl: './library-page-cards.component.html'
})
export class LibraryPageCardsComponent{
	locale = enUS.libraryPageCards
	@Output() discoverBooksClick = new EventEmitter()
	@Output() addBookFilePick = new EventEmitter()
	@Output() goToAuthorPageClick = new EventEmitter()
	discoverBooksHover: boolean = false			// Indicator for if the mouse is hovering the discover books card
	addBookHover: boolean = false					// Indicator for if the mouse is hovering the add book card
	goToAuthorPageHover: boolean = false		// Indicator for if the mouse is hovering the card for going to the author page

	constructor(
		public dataService: DataService
	) {
		this.locale = this.dataService.GetLocale().libraryPageCards
	}

	DiscoverBooksClick() {
		this.discoverBooksClick.emit()
	}

	AddBookFilePick(file: ReadFile) {
		this.addBookFilePick.emit(file)
	}

	GoToAuthorPageClick() {
		this.goToAuthorPageClick.emit()
	}
}