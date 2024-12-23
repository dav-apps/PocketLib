import { Component, Input, Output, EventEmitter } from "@angular/core"
import { ReadFile } from "ngx-file-helpers"
import { LocalizationService } from "src/app/services/localization-service"

@Component({
	selector: "pocketlib-new-book-page-book-file-section",
	templateUrl: "./new-book-page-book-file-section.component.html",
	styleUrl: "./new-book-page-book-file-section.component.scss",
	standalone: false
})
export class NewBookPageBookFileSectionComponent {
	locale = this.localizationService.locale.newBookPage
	@Input() section: number = 0
	@Input() visibleSection: number = 0
	@Input() forwardNavigation: boolean = false
	@Output() setBookFile = new EventEmitter()
	@Output() previous = new EventEmitter()
	@Output() finish = new EventEmitter()
	bookFileName: string = ""
	bookFileContent: ArrayBuffer
	bookFileType: string = ""

	constructor(private localizationService: LocalizationService) {}

	async BookFileUpload(file: ReadFile) {
		this.bookFileName = file.name
		this.bookFileType = file.type

		// Read the content of the book file
		this.bookFileContent = await new Promise(resolve => {
			let reader = new FileReader()
			reader.addEventListener("loadend", () => {
				resolve(reader.result as ArrayBuffer)
			})
			reader.readAsArrayBuffer(new Blob([file.underlyingFile]))
		})

		this.setBookFile.emit({
			bookFileName: this.bookFileName,
			bookFileContent: this.bookFileContent,
			bookFileType: this.bookFileType
		})
	}

	Previous() {
		this.previous.emit()
	}

	Finish() {
		this.finish.emit()
	}
}
