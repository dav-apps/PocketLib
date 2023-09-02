import { Component, Output, EventEmitter } from "@angular/core"
import { ReadFile } from "ngx-file-helpers"
import {
	faAddressCard as faAddressCardLight,
	faPlus as faPlusLight,
	faShoppingBag as faShoppingBagLight
} from "@fortawesome/pro-light-svg-icons"
import { DataService } from "src/app/services/data-service"
import { enUS } from "src/locales/locales"

@Component({
	selector: "pocketlib-library-page-cards",
	templateUrl: "./library-page-cards.component.html",
	styleUrls: ["./library-page-cards.component.scss"]
})
export class LibraryPageCardsComponent {
	locale = enUS.libraryPageCards
	@Output() addBookFilePick = new EventEmitter()
	faAddressCardLight = faAddressCardLight
	faPlusLight = faPlusLight
	faShoppingBagLight = faShoppingBagLight

	constructor(public dataService: DataService) {
		this.locale = this.dataService.GetLocale().libraryPageCards
	}

	AddBookFilePick(file: ReadFile) {
		this.addBookFilePick.emit(file)
	}
}
