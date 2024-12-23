import { Component, Input, Output, EventEmitter } from "@angular/core"
import { LocalizationService } from "src/app/services/localization-service"

@Component({
	selector: "pocketlib-new-book-page-title-section",
	templateUrl: "./new-book-page-title-section.component.html",
	styleUrl: "./new-book-page-title-section.component.scss",
	standalone: false
})
export class NewBookPageTitleSectionComponent {
	locale = this.localizationService.locale.newBookPage
	@Input() loading: boolean = false
	@Input() section: number = 0
	@Input() visibleSection: number = 0
	@Input() forwardNavigation: boolean = false
	@Output() submit = new EventEmitter()
	title: string = ""

	constructor(private localizationService: LocalizationService) {}

	Submit() {
		if (this.title.length >= 3 && !this.loading) {
			this.submit.emit(this.title)
		}
	}
}
