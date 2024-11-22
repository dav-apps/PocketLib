import { Component } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { confetti } from "@tsparticles/confetti"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"

@Component({
	templateUrl: "./order-confirmation-page.component.html",
	styleUrl: "./order-confirmation-page.component.scss"
})
export class OrderConfirmationPageComponent {
	slug: string = ""
	title: string = ""
	price: string = ""
	coverUrl: string = ""
	coverHeight = 270
	coverWidth = 180

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.dataService.simpleLoadingScreenVisible = true
	}

	async ngOnInit() {
		this.slug = this.activatedRoute.snapshot.paramMap.get("slug")

		// Load the VlbItem data
		let vlbItemResponse = await this.apiService.retrieveVlbItem(
			`
				title
				price
				coverUrl
			`,
			{ uuid: this.slug }
		)

		let vlbItemResponseData = vlbItemResponse.data.retrieveVlbItem

		if (vlbItemResponseData == null) {
			this.router.navigate(["store", "book", this.slug])
			return
		}

		this.title = vlbItemResponseData.title
		this.price = `${(vlbItemResponseData.price / 100).toFixed(2)} €`.replace(
			".",
			","
		)
		this.coverUrl = vlbItemResponseData.coverUrl

		this.dataService.simpleLoadingScreenVisible = false
		confetti({})
	}

	coverClick(event: PointerEvent) {
		confetti({
			position: {
				x: (event.x / window.innerWidth) * 100,
				y: (event.y / window.innerHeight) * 100
			}
		})
	}
}
