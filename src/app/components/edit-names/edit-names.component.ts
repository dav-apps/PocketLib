import { Component, Input, Output, EventEmitter } from "@angular/core"
import {
	faFloppyDisk as faFloppyDiskLight,
	faPen as faPenLight
} from "@fortawesome/pro-light-svg-icons"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { LocalizationService } from "src/app/services/localization-service"
import * as ErrorCodes from "src/constants/errorCodes"

interface Name {
	name: string
	language: string
	fullLanguage: string
	edit: boolean
	errorMessage: string
}

@Component({
	selector: "pocketlib-edit-names",
	templateUrl: "./edit-names.component.html",
	styleUrls: ["./edit-names.component.scss"]
})
export class EditNamesComponent {
	locale = this.localizationService.locale.editNames
	@Input() names: Name[] = []
	@Input() uuid: string
	@Output() update = new EventEmitter()
	faFloppyDiskLight = faFloppyDiskLight
	faPenLight = faPenLight

	constructor(
		private dataService: DataService,
		private apiService: ApiService,
		private localizationService: LocalizationService
	) {}

	async UpdateName(name: Name) {
		name.errorMessage = ""

		// Update the name on the server
		let setNameResponse = await this.apiService.setStoreBookCollectionName(
			`
				name
				language
			`,
			{
				uuid: this.uuid,
				name: name.name,
				language: name.language
			}
		)

		if (setNameResponse.errors == null) {
			let setNameResponseData =
				setNameResponse.data.setStoreBookCollectionName
			name.edit = false

			this.update.emit({
				name: setNameResponseData.name,
				language: setNameResponseData.language
			})
		} else {
			let errors = setNameResponse.errors[0].extensions.errors as string[]

			switch (errors[0]) {
				case ErrorCodes.nameTooShort:
					if (name.name.length == 0) {
						name.errorMessage = this.locale.errors.nameMissing
					} else {
						name.errorMessage = this.locale.errors.nameTooShort
					}
					break
				case ErrorCodes.nameTooLong:
					name.errorMessage = this.locale.errors.nameTooLong
					break
				default:
					name.errorMessage = this.locale.errors.unexpectedError
					break
			}
		}
	}
}
