import { Component } from "@angular/core"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"

@Component({
	selector: "pocketlib-store-start-page",
	templateUrl: "./store-start-page.component.html",
	styleUrl: "./store-start-page.component.scss",
	standalone: false
})
export class StoreStartPageComponent {
	locale = this.localizationService.locale.storeStartPage

	constructor(
		public dataService: DataService,
		private localizationService: LocalizationService
	) {
		this.dataService.setMeta()
	}
}
