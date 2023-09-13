import {
	Component,
	Input,
	Output,
	EventEmitter,
	ViewChild
} from "@angular/core"
import { DataService } from "src/app/services/data-service"
import { IsbnInputComponent } from "src/app/components/isbn-input/isbn-input.component"
import { enUS } from "src/locales/locales"

@Component({
	selector: "pocketlib-new-book-page-isbn-section",
	templateUrl: "./new-book-page-isbn-section.component.html",
	styleUrls: ["./new-book-page-isbn-section.component.scss"]
})
export class NewBookPageIsbnSectionComponent {
	locale = enUS.newBookPage
	@Input() section: number = 0
	@Input() visibleSection: number = 0
	@Input() forwardNavigation: boolean = false
	@Output() setIsbn = new EventEmitter()
	@Output() previous = new EventEmitter()
	@Output() submit = new EventEmitter()
	@ViewChild("isbnInput") isbnInput: IsbnInputComponent
	isbn: string = ""

	constructor(public dataService: DataService) {
		this.locale = this.dataService.GetLocale().newBookPage
	}

	SetIsbn(isbn: string) {
		this.isbn = isbn
		this.isbnInput.SetIsbn(isbn)
		this.setIsbn.emit(this.isbn)
	}

	Previous() {
		this.previous.emit()
	}

	Submit() {
		this.submit.emit()
	}
}
