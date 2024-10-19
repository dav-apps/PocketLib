import { Component } from "@angular/core"

@Component({
	templateUrl: "./search-page.component.html",
	styleUrl: "./search-page.component.scss"
})
export class SearchPageComponent {
	searchQueryChange(event: CustomEvent) {
		const query = event.detail.value
		console.log(query)
	}
}
