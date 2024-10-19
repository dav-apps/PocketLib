import { Component } from "@angular/core"
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
	debounceTimeoutId: number = 0
	isLoading: boolean = false
	books: BookItem[] = []

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
					query
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
		}, 500)
	}
}
