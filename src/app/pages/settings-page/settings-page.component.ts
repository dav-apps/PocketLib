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
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
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
		// Check if this is a dual-screen device with a vertical fold
		if (window["getWindowSegments"]) {
			let screenSegments = window["getWindowSegments"]()

			if (screenSegments.length > 1 && screenSegments[0].width == screenSegments[1].width) {
				this.dualScreenLayout = true

				// Calculate the width of the fold
				let foldWidth = screenSegments[1].left - screenSegments[0].right
				if (foldWidth > 0) {
					this.dualScreenFoldMargin = foldWidth / 2
				}
			}
		}

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