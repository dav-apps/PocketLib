import { Component, Input, Output, EventEmitter } from '@angular/core'
import { DataService } from 'src/app/services/data-service'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-language-dropdown',
	templateUrl: './language-dropdown.component.html'
})
export class LanguageDropdownComponent {
	@Input() language: string = "en"
	@Input() disabled: boolean = false
	@Output() updated = new EventEmitter()
	languages = enUS.misc.languages

	constructor(
		private dataService: DataService
	) {
		this.languages = this.dataService.GetLocale().misc.languages
	}

	SetLanguage(e: { event: MouseEvent, option: { key: string, text: string } }) {
		this.updated.emit(e.option.key)
	}
}