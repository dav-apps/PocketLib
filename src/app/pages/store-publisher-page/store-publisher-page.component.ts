import { Component } from "@angular/core"
import { ActivatedRoute } from "@angular/router"

@Component({
	templateUrl: "./store-publisher-page.component.html"
})
export class StorePublisherPageComponent {
	uuid: string

	constructor(private activatedRoute: ActivatedRoute) {
		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get("uuid")
	}
}
