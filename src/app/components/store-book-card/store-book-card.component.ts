import { Component, Input } from "@angular/core"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"
import { BookListItem } from "src/app/misc/types"

@Component({
	selector: "pocketlib-store-book-card",
	templateUrl: "./store-book-card.component.html",
	styleUrl: "./store-book-card.component.scss",
	standalone: false
})
export class StoreBookCardComponent {
	@Input() book: BookListItem
	@Input() highlighted: boolean = false
	alt: string = ""
	link: string = ""

	constructor(
		public dataService: DataService,
		private localizationService: LocalizationService
	) {}

	ngOnInit() {
		this.alt = this.localizationService.locale.misc.bookCoverAlt.replace(
			"{0}",
			this.book.title
		)
		this.link = `/store/book/${this.book.slug}`
	}
}
