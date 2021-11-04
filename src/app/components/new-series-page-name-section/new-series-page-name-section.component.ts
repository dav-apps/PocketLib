import { Component, Input, Output, EventEmitter } from '@angular/core'
import { DataService } from 'src/app/services/data-service'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-new-series-page-name-section',
	templateUrl: './new-series-page-name-section.component.html'
})
export class NewSeriesPageNameSectionComponent {
	locale = enUS.newSeriesPage
	@Input() loading: boolean = false
	@Input() section: number = 0
	@Input() visibleSection: number = 0
	@Input() forwardNavigation: boolean = false
	@Output() submit = new EventEmitter()
	name: string = ""

	constructor(
		public dataService: DataService
	) {
		this.locale = this.dataService.GetLocale().newSeriesPage
	}

	Submit() {
		if (this.name.length >= 3 && !this.loading) {
			this.submit.emit(this.name)
		}
	}
}