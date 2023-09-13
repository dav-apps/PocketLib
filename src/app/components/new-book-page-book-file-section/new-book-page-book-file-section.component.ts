import { Component, Input, Output, EventEmitter } from "@angular/core"
import { ReadFile } from "ngx-file-helpers"
import { DataService } from "src/app/services/data-service"
import { enUS } from "src/locales/locales"

@Component({
	selector: "pocketlib-new-book-page-book-file-section",
	templateUrl: "./new-book-page-book-file-section.component.html",
	styleUrls: ["./new-book-page-book-file-section.component.scss"]
})
export class NewBookPageBookFileSectionComponent {
	locale = enUS.newBookPage
	@Input() section: number = 0
	@Input() visibleSection: number = 0
	@Input() forwardNavigation: boolean = false
	@Output() setBookFile = new EventEmitter()
	@Output() previous = new EventEmitter()
	@Output() finish = new EventEmitter()
	bookFileName: string = ""
	bookFileContent: ArrayBuffer
	bookFileType: string = ""

	constructor(public dataService: DataService) {
		this.locale = this.dataService.GetLocale().newBookPage
	}

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
