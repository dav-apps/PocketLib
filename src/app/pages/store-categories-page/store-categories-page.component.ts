import { Component } from "@angular/core"
import { DataService } from "src/app/services/data-service"
import { RoutingService } from "src/app/services/routing-service"
import { LocalizationService } from "src/app/services/localization-service"

@Component({
	selector: "pocketlib-store-categories-page",
	templateUrl: "./store-categories-page.component.html",
	styleUrls: ["./store-categories-page.component.scss"]
})
export class StoreCategoriesPageComponent {
	locale = this.localizationService.locale.storeCategoriesPage

	constructor(
		public dataService: DataService,
		private routingService: RoutingService,
		private localizationService: LocalizationService
	) {
		this.dataService.setMeta()
	}

	backButtonClick() {
		this.routingService.navigateBack("/store")
	}
}
