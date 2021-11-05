import { Component, Input, Output, EventEmitter } from '@angular/core'
import { ApiErrorResponse, ApiResponse } from 'dav-js'
import { DropdownOption, DropdownOptionType } from 'dav-ui-components'
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

type NameType = "collection" | "series"

@Component({
	selector: 'pocketlib-edit-names',
	templateUrl: './edit-names.component.html'
})
export class EditNamesComponent {
	locale = enUS.editNames
	@Input() names: Name[] = []
	@Input() uuid: string
	@Input() type: NameType = "collection"
	@Output() update = new EventEmitter()
	addLanguageSelectedKey: string = "default"
	addLanguageOptions: DropdownOption[] = []
	newLanguageName: string = ""
	newLanguageNameError: string = ""

	constructor(
		private dataService: DataService,
		private apiService: ApiService
	) {
		this.locale = this.dataService.GetLocale().editNames
	}

	ngOnInit() {
		this.addLanguageOptions = [{
			key: "default",
			value: this.locale.selectLanguage,
			type: DropdownOptionType.option
		}]

		let languages = this.dataService.GetLocale().misc.languages
		for (let language of Object.keys(languages)) {
			if (this.names.findIndex(name => name.language == language) == -1) {
				// Add the language as an option to add
				this.addLanguageOptions.push({
					key: language,
					value: languages[language],
					type: DropdownOptionType.option
				})
			}
		}
	}

	async AddLanguage() {
		// Find the selected option
		let i = this.addLanguageOptions.findIndex(option => option.key == this.addLanguageSelectedKey)
		if (i == -1) return

		// Create the name on the server
		let setCollectionNameResponse = await this.apiService.SetStoreBookCollectionName({
			uuid: this.uuid,
			language: this.addLanguageSelectedKey,
			name: this.newLanguageName
		})

		if (setCollectionNameResponse.status == 200) {
			this.names.push({
				name: this.newLanguageName,
				language: this.addLanguageSelectedKey,
				fullLanguage: this.addLanguageOptions[i].value,
				edit: false,
				errorMessage: ""
			})

			// Remove the selected option and reset the dropdown
			this.addLanguageOptions.splice(i, 1)
			this.addLanguageSelectedKey = "default"
		} else {
			switch ((setCollectionNameResponse as ApiErrorResponse).errors[0].code) {
				case ErrorCodes.NameMissing:
					this.newLanguageNameError = this.locale.errors.nameMissing
					break
				case ErrorCodes.NameTooShort:
					this.newLanguageNameError = this.locale.errors.nameTooShort
					break
				case ErrorCodes.NameTooLong:
					this.newLanguageNameError = this.locale.errors.nameTooLong
					break
				default:
					this.newLanguageNameError = this.locale.errors.unexpectedError
					break
			}
		}
	}

	async UpdateName(name: Name) {
		name.errorMessage = ""

		// Update the name on the server
		let setCollectionNameResponse = await this.apiService.SetStoreBookCollectionName({
			uuid: this.uuid,
			language: name.language,
			name: name.name
		})

		if (setCollectionNameResponse.status == 200) {
			name.edit = false
			this.update.emit((setCollectionNameResponse as ApiResponse<any>).data)
		} else {
			switch ((setCollectionNameResponse as ApiErrorResponse).errors[0].code) {
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

	AddLanguageDropdownChange(event: CustomEvent) {
		this.addLanguageSelectedKey = event.detail.key
	}
}