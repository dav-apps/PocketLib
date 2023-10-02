import { Component } from "@angular/core"
import { DataService } from "src/app/services/data-service"
import { enUS } from "src/locales/locales"

@Component({
	selector: "pocketlib-store-start-page",
	templateUrl: "./store-start-page.component.html",
	styleUrls: ["./store-start-page.component.scss"]
})
export class StoreStartPageComponent {
	locale = enUS.storeStartPage

	constructor(public dataService: DataService) {
		this.locale = this.dataService.GetLocale().storeStartPage
	}
}
