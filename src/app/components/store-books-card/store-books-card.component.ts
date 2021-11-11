import { Component, Input } from '@angular/core'
import { DataService } from 'src/app/services/data-service'
import { BookListItem } from 'src/app/misc/types'

@Component({
	selector: 'pocketlib-store-books-card',
	templateUrl: './store-books-card.component.html'
})
export class StoreBooksCardComponent {
	@Input() books: BookListItem[] = []
	hover: boolean = false

	constructor(
		public dataService: DataService
	) { }
}