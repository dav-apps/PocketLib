import { Component, Input, Output, EventEmitter } from '@angular/core'
import { DataService } from 'src/app/services/data-service'
import { BookListItem } from 'src/app/misc/types'

@Component({
	selector: 'pocketlib-store-books-page-book-card',
	templateUrl: './store-books-page-book-card.component.html'
})
export class StoreBooksPageBookCardComponent{
	@Input() book: BookListItem
	@Output() click = new EventEmitter()
	hovered: boolean = false

	constructor(
		public dataService: DataService
	) { }

	Click() {
		this.click.emit()
	}
}