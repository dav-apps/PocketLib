import { Component } from "@angular/core"
import { Dav } from "dav-js"
import { LocalizationService } from "src/app/services/localization-service"

@Component({
	selector: "pocketlib-dav-pro-card",
	templateUrl: "./dav-pro-card.component.html"
})
export class DavProCardComponent {
	locale = this.localizationService.locale.davProCard

	constructor(private localizationService: LocalizationService) {}

	ShowPlansAccountPage() {
		Dav.ShowUserPage("plans", true)
	}
}
