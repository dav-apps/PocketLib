import { Component, Input, Output, EventEmitter } from '@angular/core'
import { DataService } from 'src/app/services/data-service'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-new-book-page-collection-section',
	templateUrl: './new-book-page-collection-section.component.html'
})
export class NewBookPageCollectionSectionComponent{
	locale = enUS.newBookPage
	@Input() section: number = 0
	@Input() visibleSection: number = 0
	@Input() forwardNavigation: boolean = false
	@Input() collections: {
		uuid: string,
		name: string,
		cover: boolean,
		coverContent: string
	}[] = []
	@Input() selectedCollection: number = -2
	@Output() select = new EventEmitter()
	@Output() previous = new EventEmitter()
	@Output() submit = new EventEmitter()

	constructor(
		public dataService: DataService
	) {
		this.locale = this.dataService.GetLocale().newBookPage
	}

	Select(index: number) {
		this.select.emit(index)
	}

	Previous() {
		this.previous.emit()
	}

	Submit() {
		this.submit.emit(this.selectedCollection)
	}
}