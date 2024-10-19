import { Component } from "@angular/core"
import { ApiService } from "src/app/services/api-service"

@Component({
	templateUrl: "./search-page.component.html",
	styleUrl: "./search-page.component.scss"
})
export class SearchPageComponent {
	constructor(private apiService: ApiService) {}

	async searchQueryChange(event: CustomEvent) {
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
		console.log(result.data.search)
	}
}
