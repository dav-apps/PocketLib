import { Component, Input, Output, EventEmitter } from '@angular/core'
import { DataService } from 'src/app/services/data-service'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-new-series-page-book-selection-section',
	templateUrl: './new-series-page-book-selection-section.component.html'
})
export class NewSeriesPageBookSelectionSectionComponent {
	locale = enUS.newSeriesPage
	@Input() section: number = 0
	@Input() visibleSection: number = 0
	@Input() forwardNavigation: boolean = false
	@Output() previous = new EventEmitter()
	@Output() finish = new EventEmitter()

	constructor(
		public dataService: DataService
	) {
		this.locale = this.dataService.GetLocale().newSeriesPage
	}

	Previous() {
		this.previous.emit()
	}

	Finish() {
		this.finish.emit()
	}
}