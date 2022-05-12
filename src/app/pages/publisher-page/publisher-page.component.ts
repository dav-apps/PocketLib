import { Component } from "@angular/core"
import { ActivatedRoute } from "@angular/router"

@Component({
	selector: "pocketlib-publisher-page",
	templateUrl: "./publisher-page.component.html"
})
export class PublisherPageComponent {
	uuid: string

	constructor(
		public activatedRoute: ActivatedRoute
	) {
		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid')
	}
}