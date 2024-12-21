import { Component } from "@angular/core"
import { ActivatedRoute } from "@angular/router"

@Component({
	templateUrl: "./store-publisher-page.component.html"
})
export class StorePublisherPageComponent {
	slug: string

	constructor(private activatedRoute: ActivatedRoute) {
		// Get the uuid from the url
		this.slug = this.activatedRoute.snapshot.paramMap.get("slug")
	}
}
