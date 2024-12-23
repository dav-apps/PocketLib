import { Component, Output, EventEmitter } from "@angular/core"
import { ReadFile } from "ngx-file-helpers"
import {
	faAddressCard as faAddressCardLight,
	faPlus as faPlusLight,
	faShoppingBag as faShoppingBagLight
} from "@fortawesome/pro-light-svg-icons"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"

@Component({
	selector: "pocketlib-library-page-cards",
	templateUrl: "./library-page-cards.component.html",
	styleUrl: "./library-page-cards.component.scss",
	standalone: false
})
export class LibraryPageCardsComponent {
	locale = this.localizationService.locale.libraryPageCards
	@Output() addBookFilePick = new EventEmitter()
	faAddressCardLight = faAddressCardLight
	faPlusLight = faPlusLight
	faShoppingBagLight = faShoppingBagLight

	constructor(
		public dataService: DataService,
		private localizationService: LocalizationService
	) {}

	AddBookFilePick(file: ReadFile) {
		this.addBookFilePick.emit(file)
	}
}
