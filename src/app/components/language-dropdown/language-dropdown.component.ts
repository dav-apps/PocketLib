import { Component, Input, Output, EventEmitter } from "@angular/core"
import { DropdownOption, DropdownOptionType } from "dav-ui-components"
import { LocalizationService } from "src/app/services/localization-service"

@Component({
	selector: "pocketlib-language-dropdown",
	templateUrl: "./language-dropdown.component.html"
})
export class LanguageDropdownComponent {
	@Input() language: string = "en"
	@Input() label: string = ""
	@Input() disabled: boolean = false
	@Output() updated = new EventEmitter()
	languages = this.localizationService.locale.misc.languages
	options: DropdownOption[] = [
		{
			key: "en",
			value: this.languages.en,
			type: DropdownOptionType.option
		},
		{
			key: "de",
			value: this.languages.de,
			type: DropdownOptionType.option
		}
	]

	constructor(private localizationService: LocalizationService) {
		this.options[0].value = this.languages.en
		this.options[1].value = this.languages.de
	}

	SetLanguage(event: CustomEvent) {
		this.updated.emit(event.detail.key)
	}
}
