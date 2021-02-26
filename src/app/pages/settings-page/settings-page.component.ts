import { Component } from '@angular/core'
import { keys } from 'src/constants/keys'
import { enUS } from 'src/locales/locales'
import { DataService } from 'src/app/services/data-service'
import { MatRadioChange } from '@angular/material/radio'

@Component({
	selector: "pocketlib-settings-page",
	templateUrl: "./settings-page.component.html"
})
export class SettingsPageComponent {
	locale = enUS.settingsPage
	version: string = keys.version
	year = (new Date()).getFullYear()
	themeKeys: string[] = [keys.lightThemeKey, keys.darkThemeKey, keys.systemThemeKey]
	selectedTheme: string
	openLastReadBook: boolean = false

	constructor(
		public dataService: DataService
	) {
		this.locale = this.dataService.GetLocale().settingsPage
	}

	async ngOnInit() {
		// Select the correct theme radio button
		this.selectedTheme = await this.dataService.GetTheme()

		// Set the openLastReadBook toggle
		this.openLastReadBook = await this.dataService.GetOpenLastReadBook()

		// Increase the font size of the toggle label
		let labels = document.getElementsByClassName('ms-Toggle-label')
		if (labels.length > 0) labels.item(0).setAttribute('style', 'font-size: 15px')
	}

	onThemeRadioButtonSelected(event: MatRadioChange) {
		this.selectedTheme = event.value
		this.dataService.SetTheme(event.value)
		this.dataService.ApplyTheme(event.value)
	}

	onOpenLastReadBookToggleChange(event: { checked: boolean }) {
		this.openLastReadBook = event.checked
		this.dataService.SetOpenLastReadBook(event.checked)
	}
}