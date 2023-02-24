import { Component } from "@angular/core"
import { ActivatedRoute } from "@angular/router"

@Component({
	selector: "pocketlib-store-author-page",
	templateUrl: "./store-author-page.component.html"
})
export class StoreAuthorPageComponent {
	uuid: string

	constructor(private activatedRoute: ActivatedRoute) {
		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get("uuid")
	}
}
