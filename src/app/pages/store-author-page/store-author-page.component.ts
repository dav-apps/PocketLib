import { Component } from "@angular/core"
import { ActivatedRoute } from "@angular/router"

@Component({
	selector: "pocketlib-store-author-page",
	templateUrl: "./store-author-page.component.html",
	standalone: false
})
export class StoreAuthorPageComponent {
	slug: string

	constructor(private activatedRoute: ActivatedRoute) {
		// Get the uuid from the url
		this.slug = this.activatedRoute.snapshot.paramMap.get("slug")
	}
}
