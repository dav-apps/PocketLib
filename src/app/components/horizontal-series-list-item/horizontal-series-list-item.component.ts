import { Component, Input } from "@angular/core"
import { DataService } from "src/app/services/data-service"
import { SeriesListItem } from "src/app/misc/types"

@Component({
	selector: "pocketlib-horizontal-series-list-item",
	templateUrl: "./horizontal-series-list-item.component.html",
	styleUrls: ["./horizontal-series-list-item.component.scss"]
})
export class HorizontalSeriesListItemComponent {
	@Input() series: SeriesListItem
	hover: boolean = false
	link: string = ""
	advancedHoverAnimation: boolean = false
	advancedHoverAnimationIndexTransform: number = 1

	constructor(public dataService: DataService) {}

	ngOnInit() {
		this.link = `/store/book/${this.series.books[0].slug}`
		this.advancedHoverAnimation = this.series.books.length > 3
		this.advancedHoverAnimationIndexTransform = Math.floor(
			(this.series.books.length - 1) / 3
		)
	}
}
