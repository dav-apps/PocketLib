import { Component, Input, Output, EventEmitter } from '@angular/core'
import { Book } from 'src/app/models/Book'
import { DataService } from 'src/app/services/data-service'

@Component({
	selector: 'pocketlib-library-page-book-card',
	templateUrl: './library-page-book-card.component.html'
})
export class LibraryPageBookCardComponent {
	@Input() book: Book = new Book(null, null, true, null)
	@Output() click = new EventEmitter()
	@Output() contextMenu = new EventEmitter()
	hovered: boolean = false

	constructor(
		public dataService: DataService
	) { }

	Click() {
		this.click.emit()
	}

	ContextMenu(event: MouseEvent) {
		this.contextMenu.emit(event)
	}
}