import { Component } from "@angular/core"
import { DataService } from "src/app/services/data-service"
import { RoutingService } from "src/app/services/routing-service"

@Component({
	selector: "pocketlib-store-categories-page",
	templateUrl: "./store-categories-page.component.html",
	styleUrls: ["./store-categories-page.component.scss"]
})
export class StoreCategoriesPageComponent {
	constructor(
		public dataService: DataService,
		private routingService: RoutingService
	) {}

	backButtonClick() {
		this.routingService.NavigateBack("/store")
	}
}
