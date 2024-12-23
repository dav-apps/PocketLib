import { Component, Input, Output, EventEmitter } from "@angular/core"
import { LocalizationService } from "src/app/services/localization-service"

@Component({
	selector: "pocketlib-new-book-page-collection-section",
	templateUrl: "./new-book-page-collection-section.component.html",
	styleUrl: "./new-book-page-collection-section.component.scss",
	standalone: false
})
export class NewBookPageCollectionSectionComponent {
	locale = this.localizationService.locale.newBookPage
	@Input() section: number = 0
	@Input() visibleSection: number = 0
	@Input() forwardNavigation: boolean = false
	@Input() collections: {
		uuid: string
		name: string
		cover: boolean
		coverContent: string
	}[] = []
	@Output() select = new EventEmitter()
	@Output() previous = new EventEmitter()
	@Output() submit = new EventEmitter()

	constructor(private localizationService: LocalizationService) {}

	Select(index: number) {
		this.select.emit(index)
	}

	Previous() {
		this.previous.emit()
	}
}
