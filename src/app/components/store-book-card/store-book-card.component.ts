import { Component, Input } from "@angular/core"
import { DataService } from "src/app/services/data-service"
import { BookListItem } from "src/app/misc/types"

@Component({
	selector: "pocketlib-store-book-card",
	templateUrl: "./store-book-card.component.html",
	styleUrls: ["./store-book-card.component.scss"]
})
export class StoreBookCardComponent {
	@Input() book: BookListItem
	@Input() highlighted: boolean = false
	alt: string = ""
	link: string = ""

	constructor(public dataService: DataService) {}

	ngOnInit() {
		this.alt = this.dataService
			.GetLocale()
			.misc.bookCoverAlt.replace("{0}", this.book.title)
		this.link = `/store/book/${this.book.slug}`
	}
}
