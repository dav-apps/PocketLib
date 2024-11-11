import { Component } from "@angular/core"
import { Router, ActivatedRoute, ParamMap } from "@angular/router"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { RoutingService } from "src/app/services/routing-service"

interface BookItem {
	id: string
	coverUrl: string
	title: string
}

@Component({
	selector: "pocketlib-store-series-page",
	templateUrl: "./store-series-page.component.html",
	styleUrl: "./store-series-page.component.scss"
})
export class StoreSeriesPageComponent {
	uuid: string = ""
	slug: string = ""
	title: string = ""
	books: BookItem[] = []
	loading: boolean = false

	//#region Variables for pagination
	pages: number = 1
	page: number = 1
	maxVisibleBooks: number = 12
	//#endregion

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private router: Router,
		private routingService: RoutingService,
		private activatedRoute: ActivatedRoute
	) {
		this.dataService.simpleLoadingScreenVisible = true

		this.activatedRoute.paramMap.subscribe((paramMap: ParamMap) => {
			this.slug = paramMap.get("slug")
			this.loadSeries()
		})

		this.activatedRoute.url.subscribe(() => {
			const queryParams = this.activatedRoute.snapshot.queryParamMap

			if (queryParams.has("page")) {
				this.page = Number(queryParams.get("page"))
				this.loadBooks()
			}
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

		await this.loadBooks()
	}

	async loadBooks() {
		this.loading = true
		this.books = []

		let listVlbItemsResponse = await this.apiService.listVlbItems(
			`
				total
				items {
					id
					title
					coverUrl
				}
			`,
			{
				vlbCollectionUuid: this.uuid,
				limit: this.maxVisibleBooks,
				offset: (this.page - 1) * this.maxVisibleBooks
			}
		)

		this.dataService.simpleLoadingScreenVisible = false
		this.loading = false

		let listVlbItemsResponseData = listVlbItemsResponse.data?.listVlbItems
		if (listVlbItemsResponse == null) return

		this.pages = Math.ceil(
			listVlbItemsResponseData.total / this.maxVisibleBooks
		)

		for (let book of listVlbItemsResponseData.items) {
			this.books.push({
				id: book.id,
				coverUrl: book.coverUrl,
				title: book.title
			})
		}
	}

	backButtonClick() {
		this.routingService.NavigateBack("/store")
	}

	pageChange(page: number) {
		this.page = page
		this.router.navigate([], { queryParams: { page } })
		this.loadBooks()
	}
}
