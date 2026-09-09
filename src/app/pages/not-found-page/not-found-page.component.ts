import { Component } from "@angular/core"
import { DataService } from "src/app/services/data-service"

@Component({
	selector: "pocketlib-not-found-page",
	template: "<pocketlib-not-found></pocketlib-not-found>",
	standalone: false
})
export class NotFoundPageComponent {
	constructor(private dataService: DataService) {
		this.dataService.setNotFound()
	}
}
