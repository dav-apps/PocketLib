import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core'
import { DataService } from 'src/app/services/data-service'

@Component({
	selector: 'pocketlib-horizontal-book-card',
	templateUrl: './horizontal-book-card.component.html'
})
export class HorizontalBookCardComponent {
	@Input() title: string = ""
	@Input() coverContent: string = ""
	@Input() coverBlurhash: string = ""
	@Output() click = new EventEmitter()
	hovered: boolean = false
	fontSize: number = 20

	constructor(
		public dataService: DataService
	) { }

	ngOnInit() {
		this.setSize()
	}

	@HostListener('window:resize')
	onResize() {
		this.setSize()
	}

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

	Click() {
		this.click.emit()
	}
}