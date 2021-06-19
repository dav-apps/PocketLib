import { Component } from '@angular/core'
import { SwUpdate } from '@angular/service-worker'
import { keys } from 'src/constants/keys'
import { enUS } from 'src/locales/locales'
import { DataService } from 'src/app/services/data-service'
import { MatRadioChange } from '@angular/material/radio'
import { GetDualScreenSettings } from 'src/app/misc/utils'

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
	updateAvailable: boolean = false

	constructor(
		public dataService: DataService,
		private swUpdate: SwUpdate
	) {
		this.locale = this.dataService.GetLocale().settingsPage

		// Check if this is a dual-screen device with a vertical fold
		let dualScreenSettings = GetDualScreenSettings()
		this.dualScreenLayout = dualScreenSettings.dualScreenLayout
		this.dualScreenFoldMargin = dualScreenSettings.dualScreenFoldMargin
	}

	async ngOnInit() {
		// Select the correct theme radio button
		this.selectedTheme = await this.dataService.GetTheme()

		// Set the openLastReadBook toggle
		this.openLastReadBook = await this.dataService.GetOpenLastReadBook()

		// Increase the font size of the toggle label
		let labels = document.getElementsByClassName('ms-Toggle-label')
		if (labels.length > 0) labels.item(0).setAttribute('style', 'font-size: 15px')

		// Check for updates
		this.swUpdate.available.subscribe(event => {
			this.updateAvailable = true
		})
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

	InstallUpdate() {
		window.location.reload()
	}
}