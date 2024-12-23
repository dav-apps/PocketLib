import { Component, Input, Output, EventEmitter } from "@angular/core"
import { ReadFile } from "ngx-file-helpers"
import { LocalizationService } from "src/app/services/localization-service"

@Component({
	selector: "pocketlib-new-book-page-cover-section",
	templateUrl: "./new-book-page-cover-section.component.html",
	styleUrl: "./new-book-page-cover-section.component.scss",
	standalone: false
})
export class NewBookPageCoverSectionComponent {
	locale = this.localizationService.locale.newBookPage
	@Input() section: number = 0
	@Input() visibleSection: number = 0
	@Input() forwardNavigation: boolean = false
	@Output() setCover = new EventEmitter()
	@Output() previous = new EventEmitter()
	@Output() submit = new EventEmitter()
	coverContentBase64: string = ""
	coverContent: ArrayBuffer
	coverType: string = ""

	constructor(private localizationService: LocalizationService) {}

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
