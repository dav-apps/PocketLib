import { Component } from "@angular/core"
import { ApiService } from "src/app/services/api-service"

@Component({
	templateUrl: "./search-page.component.html",
	styleUrl: "./search-page.component.scss"
})
export class SearchPageComponent {
	debounceTimeoutId: number = 0
	isLoading: boolean = false

	constructor(private apiService: ApiService) {}

	searchQueryChange(event: CustomEvent) {
		if (this.debounceTimeoutId != 0) {
			window.clearTimeout(this.debounceTimeoutId)
		}

		this.isLoading = true

		this.debounceTimeoutId = window.setTimeout(async () => {
			const query = event.detail.value

			let result = await this.apiService.search(
				`
					total
					items {
						... on VlbItem {
							title
						}
					}
				`,
				{
					query
				}
			)

			this.isLoading = false
			console.log(result.data.search)
		}, 500)
	}
}
