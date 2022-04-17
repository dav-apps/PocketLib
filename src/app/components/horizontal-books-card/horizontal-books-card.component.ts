import { Component, Input, HostListener } from '@angular/core'
import { StoreBookItem } from 'src/app/misc/types'
import { DataService } from 'src/app/services/data-service'

@Component({
	selector: 'pocketlib-horizontal-books-card',
	templateUrl: './horizontal-books-card.component.html'
})
export class HorizontalBooksCardComponent {
	@Input() title: string = ""
	@Input() books: StoreBookItem[] = []
	@Input() link: string = ""
	hovered: boolean = false
	fontSize: number = 20

	constructor(
		public dataService: DataService
	) { }

	@HostListener('window:resize')
	setSize() {
		let bookCardParent = document.getElementById("book-card-parent") as HTMLDivElement
		let bookCardParentWidth = bookCardParent.clientWidth

		if (bookCardParentWidth <= 360) {
			this.fontSize = 17
		} else if (bookCardParentWidth <= 400) {
			this.fontSize = 18
		} else if (bookCardParentWidth <= 470) {
			this.fontSize = 19
		} else {
			this.fontSize = 20
		}
	}
}