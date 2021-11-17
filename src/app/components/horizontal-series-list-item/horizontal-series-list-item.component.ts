import { Component, Input } from '@angular/core'
import { DataService } from 'src/app/services/data-service'
import { SeriesListItem } from 'src/app/misc/types'

@Component({
	selector: 'pocketlib-horizontal-series-list-item',
	templateUrl: './horizontal-series-list-item.component.html'
})
export class HorizontalSeriesListItemComponent {
	@Input() series: SeriesListItem
	hover: boolean = false
	link: string = ""

	constructor(
		public dataService: DataService
	) { }

	ngOnInit() {
		this.link = `/store/book/${this.series.books[0].uuid}`
	}
}