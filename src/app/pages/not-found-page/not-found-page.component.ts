import { Component } from "@angular/core"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"

@Component({
	selector: "pocketlib-not-found-page",
	template: "<pocketlib-not-found></pocketlib-not-found>",
	standalone: false
})
export class NotFoundPageComponent {
	constructor(
		private dataService: DataService,
		private localizationService: LocalizationService
	) {
		// Any url the router could not match, so the server has to say so
		this.dataService.setNotFound()
		this.dataService.setMeta({
			title: `${this.localizationService.locale.notFoundPage.headline} | PocketLib`
		})
	}
}
