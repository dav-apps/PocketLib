import { Component, Input, HostListener } from "@angular/core"
import { DataService } from "src/app/services/data-service"

@Component({
	selector: "pocketlib-horizontal-book-card",
	templateUrl: "./horizontal-book-card.component.html"
})
export class HorizontalBookCardComponent {
	@Input() title: string = ""
	@Input() coverContent: string = ""
	@Input() coverBlurhash: string = ""
	@Input() link: string = ""
	hovered: boolean = false
	fontSize: number = 20
	alt: string = ""

	constructor(public dataService: DataService) {}

	ngOnInit() {
		this.setSize()
		this.alt = this.dataService
			.GetLocale()
			.misc.bookCoverAlt.replace("{0}", this.title)
	}

	@HostListener("window:resize")
	setSize() {
		let bookCardParent = document.getElementById(
			"book-card-parent"
		) as HTMLDivElement
		let bookCardParentWidth = bookCardParent.clientWidth

		if (bookCardParentWidth <= 360) {
			this.fontSize = 17
		} else if (bookCardParentWidth <= 400) {
			this.fontSize = 18
		} else if (bookCardParentWidth <= 470) {
			this.fontSize = 19
		} else {
			this.fontSize = 20
		}
	}
}
