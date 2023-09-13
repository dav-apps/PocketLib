import { Component, Input, Output, EventEmitter } from "@angular/core"
import { ReadFile } from "ngx-file-helpers"
import { DataService } from "src/app/services/data-service"
import { enUS } from "src/locales/locales"

@Component({
	selector: "pocketlib-new-book-page-cover-section",
	templateUrl: "./new-book-page-cover-section.component.html",
	styleUrls: ["./new-book-page-cover-section.component.scss"]
})
export class NewBookPageCoverSectionComponent {
	locale = enUS.newBookPage
	@Input() section: number = 0
	@Input() visibleSection: number = 0
	@Input() forwardNavigation: boolean = false
	@Output() setCover = new EventEmitter()
	@Output() previous = new EventEmitter()
	@Output() submit = new EventEmitter()
	coverContentBase64: string = ""
	coverContent: ArrayBuffer
	coverType: string = ""

	constructor(public dataService: DataService) {
		this.locale = this.dataService.GetLocale().newBookPage
	}

	async CoverUpload(file: ReadFile) {
		this.coverContentBase64 = file.content
		this.coverType = file.type

		// Read the content of the image file
		this.coverContent = await new Promise(resolve => {
			let reader = new FileReader()
			reader.addEventListener("loadend", () => {
				resolve(reader.result as ArrayBuffer)
			})
			reader.readAsArrayBuffer(new Blob([file.underlyingFile]))
		})

		this.setCover.emit({
			coverContentBase64: this.coverContentBase64,
			coverContent: this.coverContent,
			coverType: this.coverType
		})
	}

	Previous() {
		this.previous.emit()
	}

	Submit() {
		this.submit.emit()
	}
}
