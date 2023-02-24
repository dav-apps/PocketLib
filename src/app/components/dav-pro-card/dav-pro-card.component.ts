import { Component } from "@angular/core"
import { Dav } from "dav-js"
import { DataService } from "src/app/services/data-service"
import { enUS } from "src/locales/locales"

@Component({
	selector: "pocketlib-dav-pro-card",
	templateUrl: "./dav-pro-card.component.html"
})
export class DavProCardComponent {
	locale = enUS.davProCard

	constructor(public dataService: DataService) {
		this.locale = this.dataService.GetLocale().davProCard
	}

	ShowPlansAccountPage() {
		Dav.ShowUserPage("plans", true)
	}
}
