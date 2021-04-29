import { Component, Input, Output, EventEmitter } from '@angular/core'
import { SpinnerSize } from 'office-ui-fabric-react'
import { DataService } from 'src/app/services/data-service'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-new-book-page-title-section',
	templateUrl: './new-book-page-title-section.component.html'
})
export class NewBookPageTitleSectionComponent{
	locale = enUS.newBookPage
	@Input() loading: boolean = false
	@Input() section: number = 0
	@Input() visibleSection: number = 0
	@Input() forwardNavigation: boolean = false
	@Output() submit = new EventEmitter()
	title: string = ""
	spinnerSize: SpinnerSize = SpinnerSize.small

	constructor(
		public dataService: DataService
	) {
		this.locale = this.dataService.GetLocale().newBookPage
	}

	Submit() {
		this.submit.emit(this.title)
	}
}