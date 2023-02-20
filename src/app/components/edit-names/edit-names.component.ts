import { Component, Input, Output, EventEmitter } from '@angular/core'
import {
	faFloppyDisk as faFloppyDiskLight,
	faPen as faPenLight
} from '@fortawesome/pro-light-svg-icons'
import { ApiErrorResponse, isSuccessStatusCode } from 'dav-js'
import { DataService } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import * as ErrorCodes from 'src/constants/errorCodes'
import { enUS } from 'src/locales/locales'

interface Name {
	name: string
	language: string
	fullLanguage: string
	edit: boolean
	errorMessage: string
}

@Component({
	selector: 'pocketlib-edit-names',
	templateUrl: './edit-names.component.html'
})
export class EditNamesComponent {
	locale = enUS.editNames
	@Input() names: Name[] = []
	@Input() uuid: string
	@Output() update = new EventEmitter()
	faFloppyDiskLight = faFloppyDiskLight
	faPenLight = faPenLight

	constructor(
		private dataService: DataService,
		private apiService: ApiService
	) {
		this.locale = this.dataService.GetLocale().editNames
	}

	async UpdateName(name: Name) {
		name.errorMessage = ""

		// Update the name on the server
		let setNameResponse = await this.apiService.SetStoreBookCollectionName({
			uuid: this.uuid,
			language: name.language,
			name: name.name
		})

		if (isSuccessStatusCode(setNameResponse.status)) {
			name.edit = false

			this.update.emit({
				name: name.name,
				language: name.language
			})
		} else {
			let errorCode = (setNameResponse as ApiErrorResponse).errors[0].code

			switch (errorCode) {
				case ErrorCodes.NameMissing:
					name.errorMessage = this.locale.errors.nameMissing
					break
				case ErrorCodes.NameTooShort:
					name.errorMessage = this.locale.errors.nameTooShort
					break
				case ErrorCodes.NameTooLong:
					name.errorMessage = this.locale.errors.nameTooLong
					break
				default:
					name.errorMessage = this.locale.errors.unexpectedError
					break
			}
		}
	}
}