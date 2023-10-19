import { Component } from "@angular/core"
import { DataService } from "src/app/services/data-service"
import { RoutingService } from "src/app/services/routing-service"
import { enUS } from "src/locales/locales"

@Component({
	selector: "pocketlib-store-categories-page",
	templateUrl: "./store-categories-page.component.html",
	styleUrls: ["./store-categories-page.component.scss"]
})
export class StoreCategoriesPageComponent {
	locale = enUS.storeCategoriesPage

	constructor(
		public dataService: DataService,
		private routingService: RoutingService
	) {
		this.locale = this.dataService.GetLocale().storeCategoriesPage
	}

	backButtonClick() {
		this.routingService.NavigateBack("/store")
	}
}
