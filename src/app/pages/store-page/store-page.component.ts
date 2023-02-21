import { Component } from '@angular/core'
import { DataService } from 'src/app/services/data-service'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-store-page',
	templateUrl: './store-page.component.html'
})
export class StorePageComponent {
	locale = enUS.storePage
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	selectLanguagesDialogVisible: boolean = false

	constructor(
		public dataService: DataService
	) {
		this.locale = this.dataService.GetLocale().storePage
	}
}