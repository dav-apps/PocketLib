import { Component, Input, Output, EventEmitter } from "@angular/core"
import {
	faFloppyDisk as faFloppyDiskLight,
	faPen as faPenLight,
	faXmark as faXmarkLight
} from "@fortawesome/pro-light-svg-icons"
import { DataService } from "src/app/services/data-service"
import { enUS } from "src/locales/locales"

const isbnValidityRegex =
	/^[0-9]{1,7}(\-|\ )?[0-9]{1,7}(\-|\ )?[0-9]{1,7}(\-|\ )?[0-9]{1,7}(\-|\ )?[0-9]$/

@Component({
	selector: "pocketlib-isbn-input",
	templateUrl: "./isbn-input.component.html",
	styleUrls: ["./isbn-input.component.scss"]
})
export class IsbnInputComponent {
	locale = enUS.isbnInput
	faFloppyDiskLight = faFloppyDiskLight
	faPenLight = faPenLight
	faXmarkLight = faXmarkLight
	edit: boolean = false
	@Input() canEdit: boolean = false
	@Output() update = new EventEmitter()
	previousIsbn: string = ""
	isbn: string = ""
	errorMessage: string = ""

	constructor(public dataService: DataService) {
		this.locale = this.dataService.GetLocale().isbnInput
	}

	EnableEditing() {
		this.SetEdit(true)
	}

	SetEdit(edit: boolean) {
		this.edit = edit
		this.errorMessage = ""
	}

	UpdateValue() {
		if (this.isbn.length == 0) {
			this.errorMessage = ""
			this.previousIsbn = ""
			this.update.emit("")
		} else {
			// Check if the isbn is valid
			if (!isbnValidityRegex.test(this.isbn)) {
				// Show error message
				this.errorMessage = this.locale.errors.isbnInvalid
				return
			}

			// Check if the isbn has the correct length
			let strippedIsbn = this.isbn.replace(/(\-|\ )/g, "")

			if (strippedIsbn.length != 10 && strippedIsbn.length != 13) {
				// Show error message
				this.errorMessage = this.locale.errors.isbnInvalid
				return
			}

			this.errorMessage = ""
			this.previousIsbn = strippedIsbn
			this.update.emit(strippedIsbn)
		}
	}

	Cancel() {
		this.isbn = this.previousIsbn
		this.SetEdit(false)
	}

	public SetIsbn(isbn: string) {
		this.isbn = isbn
		this.previousIsbn = isbn
		this.SetEdit(false)
	}

	public SetError(error: string) {
		this.errorMessage = error
	}
}
