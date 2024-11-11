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
	uuid: string = ""
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
					uuid
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

		this.uuid = retrieveVlbCollectionResponseData.uuid
		this.title = retrieveVlbCollectionResponseData.title

		let listVlbItemsResponse = await this.apiService.listVlbItems(
			`
				total
				items {
					id
					title
					coverUrl
				}
			`,
			{ vlbCollectionUuid: this.uuid }
		)

		let listVlbItemsResponseData = listVlbItemsResponse.data?.listVlbItems
		if (listVlbItemsResponse == null) return

		console.log(listVlbItemsResponseData)
	}
}
