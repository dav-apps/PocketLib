import {
	Component,
	Input,
	Output,
	EventEmitter,
	ViewChild
} from "@angular/core"
import { LocalizationService } from "src/app/services/localization-service"
import { IsbnInputComponent } from "src/app/components/isbn-input/isbn-input.component"

@Component({
	selector: "pocketlib-new-book-page-isbn-section",
	templateUrl: "./new-book-page-isbn-section.component.html",
	styleUrl: "./new-book-page-isbn-section.component.scss",
	standalone: false
})
export class NewBookPageIsbnSectionComponent {
	locale = this.localizationService.locale.newBookPage
	@Input() section: number = 0
	@Input() visibleSection: number = 0
	@Input() forwardNavigation: boolean = false
	@Output() setIsbn = new EventEmitter()
	@Output() previous = new EventEmitter()
	@Output() submit = new EventEmitter()
	@ViewChild("isbnInput") isbnInput: IsbnInputComponent
	isbn: string = ""

	constructor(private localizationService: LocalizationService) {}

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
