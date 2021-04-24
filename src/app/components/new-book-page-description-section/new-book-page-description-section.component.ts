import { Component, Input, Output, EventEmitter } from '@angular/core'
import { DataService } from 'src/app/services/data-service'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-new-book-page-description-section',
	templateUrl: './new-book-page-description-section.component.html'
})
export class NewBookPageDescriptionSectionComponent{
	locale = enUS.newBookPage
	@Input() section: number = 0
	@Input() visibleSection: number = 0
	@Input() forwardNavigation: boolean = false
	@Output() setLanguage = new EventEmitter()
	@Output() previous = new EventEmitter()
	@Output() submit = new EventEmitter()
	description: string = ""
	language: string = this.dataService.supportedLocale

	constructor(
		public dataService: DataService
	) {
		this.locale = this.dataService.GetLocale().newBookPage
	}

	SetLanguage(language: string) {
		this.language = language
		this.setLanguage.emit(language)
	}

	Previous() {
		this.previous.emit()
	}

	Submit() {
		this.submit.emit(this.description)
	}
}