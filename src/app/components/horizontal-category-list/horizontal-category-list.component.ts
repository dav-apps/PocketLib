import { Component, Input } from "@angular/core"
import { Router } from "@angular/router"
import { faArrowRight as faArrowRightLight } from "@fortawesome/pro-light-svg-icons"
import { CategoryCard } from "src/app/misc/types"
import { CategoryToCategoryCard } from "src/app/misc/utils"
import { DataService } from "src/app/services/data-service"

type HorizontalCategoryListAlignment = "start" | "center"

@Component({
	selector: "pocketlib-horizontal-category-list",
	templateUrl: "./horizontal-category-list.component.html",
	styleUrl: "./horizontal-category-list.component.scss",
	standalone: false
})
export class HorizontalCategoryListComponent {
	@Input() headline: string = ""
	@Input() alignment: HorizontalCategoryListAlignment = "start"
	faArrowRightLight = faArrowRightLight
	loading: boolean = true
	cards: CategoryCard[] = []

	constructor(private dataService: DataService, private router: Router) {}

	async ngOnInit() {
		await this.dataService.categoriesPromiseHolder.AwaitResult()

		let categoryCards: CategoryCard[] = []

		for (let category of this.dataService.categories) {
			let categoryCard = CategoryToCategoryCard(category)

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

	moreButtonClick(event: PointerEvent) {
		event.preventDefault()
		this.dataService.contentContainer.scrollTo(0, 0)
		this.router.navigate(["store", "categories"])
	}

	categoryIconCardClick(event: Event, categoryKey: string) {
		event.preventDefault()
		this.router.navigate(["store", "category", categoryKey])
	}
}
