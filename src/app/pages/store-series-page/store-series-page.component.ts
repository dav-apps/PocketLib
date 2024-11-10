import { Component } from "@angular/core"
import { ActivatedRoute, ParamMap } from "@angular/router"
import { ApiService } from "src/app/services/api-service"
import { RoutingService } from "src/app/services/routing-service"

@Component({
	selector: "pocketlib-store-series-page",
	templateUrl: "./store-series-page.component.html",
	styleUrl: "./store-series-page.component.scss"
})
export class StoreSeriesPageComponent {
	slug: string = ""
	title: string = ""

	constructor(
		private apiService: ApiService,
		private routingService: RoutingService,
		private activatedRoute: ActivatedRoute
	) {
		this.activatedRoute.paramMap.subscribe((paramMap: ParamMap) => {
			this.slug = paramMap.get("slug")
			this.loadSeries()
		})
	}

	async loadSeries() {
		let retrieveVlbCollectionResponse =
			await this.apiService.retrieveVlbCollection(
				`
					title
				`,
				{ uuid: this.slug }
			)

		let retrieveVlbCollectionResponseData =
			retrieveVlbCollectionResponse.data?.retrieveVlbCollection

		if (retrieveVlbCollectionResponseData == null) {
			// Redirect to back
			this.routingService.NavigateBack("/store")
			return
		}

		this.title = retrieveVlbCollectionResponseData.title
	}
}
