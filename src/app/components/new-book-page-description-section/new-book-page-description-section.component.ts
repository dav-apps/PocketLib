import {
	Component,
	Input,
	Output,
	EventEmitter,
	Inject,
	PLATFORM_ID
} from "@angular/core"
import { isPlatformBrowser } from "@angular/common"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"
import { getLanguage } from "src/app/misc/utils"

@Component({
	selector: "pocketlib-new-book-page-description-section",
	templateUrl: "./new-book-page-description-section.component.html",
	styleUrl: "./new-book-page-description-section.component.scss",
	standalone: false
})
export class NewBookPageDescriptionSectionComponent {
	locale = this.localizationService.locale.newBookPage
	@Input() section: number = 0
	@Input() visibleSection: number = 0
	@Input() forwardNavigation: boolean = false
	@Output() setLanguage = new EventEmitter()
	@Output() previous = new EventEmitter()
	@Output() submit = new EventEmitter()
	description: string = ""
	language: string = getLanguage(isPlatformBrowser(this.platformId))

	constructor(
		public dataService: DataService,
		private localizationService: LocalizationService,
		@Inject(PLATFORM_ID) private platformId: object
	) {}

	SetLanguage(language: string) {
		this.language = language
		this.setLanguage.emit(language)
	}

	Previous() {
		this.previous.emit()
	}

	Submit() {
		this.submit.emit(this.description)
	}
}
