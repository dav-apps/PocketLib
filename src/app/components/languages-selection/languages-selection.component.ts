import { Component } from '@angular/core'
import { DataService } from 'src/app/services/data-service'

@Component({
	selector: 'pocketlib-languages-selection',
	templateUrl: './languages-selection.component.html'
})
export class LanguagesSelectionComponent{
	languages: Language[] = []
	selectedLanguages: string[] = []

	constructor(
		public dataService: DataService
	) { }

	async ngOnInit() {
		// Get the languages
		this.languages = []

		let languages = this.dataService.GetLocale().misc.languages
		for (let language of Object.keys(languages)) {
			this.languages.push({
				code: language,
				name: languages[language],
				checked: false,
				disabled: false
			})
		}

		await this.SelectInitialLanguages()
		this.DisableOnlySelectedLanguage()
	}

	async SelectInitialLanguages() {
		// Get the selected languages from the database
		let selectedLanguages = await this.dataService.GetStoreLanguages()
		
		// Check all selected languages
		for (let language of this.languages) {
			if (selectedLanguages.includes(language.code)) {
				language.checked = true
			}
		}
	}

	DisableOnlySelectedLanguage() {
		// Check if there is only one selected language
		let count = 0
		let selectedLanguage: Language

		for (let lang of this.languages) {
			if (lang.checked) {
				count++
				lang.disabled = false
				selectedLanguage = lang
			}
		}
		if(count != 1) return

		selectedLanguage.disabled = true
	}

	async ToggleLanguage(code: string) {
		let i = this.languages.findIndex(l => l.code == code)
		if(i == -1) return

		this.languages[i].checked = !this.languages[i].checked
		this.DisableOnlySelectedLanguage()

		// Save the selected languages in the database
		let languageCodes: string[] = []
		for (let language of this.languages) {
			if (language.checked) {
				languageCodes.push(language.code)
			}
		}

		await this.dataService.SetStoreLanguages(languageCodes)
	}
}

interface Language{
	code: string,
	name: string,
	checked: boolean,
	disabled: boolean
}