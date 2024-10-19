import { Component } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { ApiService } from "src/app/services/api-service"

interface BookItem {
	id: string
	title: string
	author: string
	coverUrl: string
}

@Component({
	templateUrl: "./search-page.component.html",
	styleUrl: "./search-page.component.scss"
})
export class SearchPageComponent {
	books: BookItem[] = []
	debounceTimeoutId: number = 0
	isLoading: boolean = false
	query: string = ""
	pages: number = 1
	page: number = 1

	constructor(
		private apiService: ApiService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.activatedRoute.url.subscribe(() => {
			if (this.activatedRoute.snapshot.queryParamMap.has("page")) {
				this.page = +this.activatedRoute.snapshot.queryParamMap.get("page")
			}

			if (this.activatedRoute.snapshot.queryParamMap.has("query")) {
				this.query = this.activatedRoute.snapshot.queryParamMap.get("query")
			}

			this.triggerSearch()
		})
	}

	searchQueryChange(event: CustomEvent) {
		this.query = event.detail.value
		this.triggerSearch()
	}

	triggerSearch() {
		if (this.query.length == 0) {
			this.books = []
			this.updateUrl()
			return
		}

		if (this.debounceTimeoutId != 0) {
			window.clearTimeout(this.debounceTimeoutId)
		}

		this.isLoading = true

		this.debounceTimeoutId = window.setTimeout(async () => {
			let result = await this.apiService.search(
				`
					total
					items {
						... on VlbItem {
							id
							title
							coverUrl
							author {
								firstName
								lastName
							}
						}
					}
				`,
				{
					query: this.query
				}
			)

			this.books = []

			for (let item of result.data.search.items) {
				this.books.push({
					id: item.id,
					title: item.title,
					author: item.author
						? `${item.author.firstName} ${item.author.lastName}`
						: "",
					coverUrl: item.coverUrl
				})
			}

			this.isLoading = false
			this.updateUrl()
		}, 500)
	}

	updateUrl() {
		this.router.navigate([], {
			queryParams: { query: this.query, page: this.page }
		})
	}
}
