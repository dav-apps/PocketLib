import { Component, Input, Output, EventEmitter } from "@angular/core"
import {
	faFloppyDisk as faFloppyDiskLight,
	faPen as faPenLight
} from "@fortawesome/pro-light-svg-icons"
import { DataService } from "src/app/services/data-service"
import { GraphQLService } from "src/app/services/graphql-service"
import * as ErrorCodes from "src/constants/errorCodes"
import { enUS } from "src/locales/locales"

interface Name {
	name: string
	language: string
	fullLanguage: string
	edit: boolean
	errorMessage: string
}

@Component({
	selector: "pocketlib-edit-names",
	templateUrl: "./edit-names.component.html"
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
		private graphqlService: GraphQLService
	) {
		this.locale = this.dataService.GetLocale().editNames
	}

	async UpdateName(name: Name) {
		name.errorMessage = ""

		// Update the name on the server
		let setNameResponse =
			await this.graphqlService.setStoreBookCollectionName(
				`
					success
					errors
					item {
						name
						language
					}
				`,
				{
					uuid: this.uuid,
					name: name.name,
					language: name.language
				}
			)

		let setNameResponseData = setNameResponse.data.setStoreBookCollectionName

		if (setNameResponseData.success) {
			name.edit = false

			this.update.emit({
				name: setNameResponseData.item.name,
				language: setNameResponseData.item.language
			})
		} else if (setNameResponseData.errors.length > 0) {
			switch (setNameResponseData.errors[0]) {
				case ErrorCodes.NameTooShort:
					if (name.name.length == 0) {
						name.errorMessage = this.locale.errors.nameMissing
					} else {
						name.errorMessage = this.locale.errors.nameTooShort
					}
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
