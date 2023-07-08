import { Component } from "@angular/core"
import { CategoryCard } from "src/app/misc/types"
import { CategoryResourceToCategoryCard } from "src/app/misc/utils"
import { DataService } from "src/app/services/data-service"

@Component({
	selector: "pocketlib-horizontal-category-list",
	templateUrl: "./horizontal-category-list.component.html",
	styleUrls: ["./horizontal-category-list.component.scss"]
})
export class HorizontalCategoryListComponent {
	loading: boolean = true
	cards: CategoryCard[] = []

	constructor(private dataService: DataService) {}

	async ngOnInit() {
		await this.dataService.categoriesPromiseHolder.AwaitResult()

		let categoryCards: CategoryCard[] = []

		for (let category of this.dataService.categories) {
			let categoryCard = CategoryResourceToCategoryCard(category)

			if (categoryCard != null) {
				categoryCards.push(categoryCard)
			}
		}

		// Select 4 random categories
		while (this.cards.length < 4) {
			let i = Math.floor(Math.random() * categoryCards.length)
			let selectedCard = categoryCards.splice(i, 1)[0]

			// Check if the cards already contain a card with the icon of the selected card
			let j = this.cards.findIndex(c => c.icon == selectedCard.icon)

			if (j == -1) {
				this.cards.push(selectedCard)
			}
		}

		this.loading = false
	}
}
