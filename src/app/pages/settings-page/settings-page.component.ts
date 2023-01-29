import { Component } from '@angular/core'
import { SwUpdate, VersionEvent } from '@angular/service-worker'
import { faCheck } from '@fortawesome/pro-light-svg-icons'
import { keys } from 'src/constants/keys'
import { enUS } from 'src/locales/locales'
import { DataService } from 'src/app/services/data-service'
import { MatLegacyRadioChange as MatRadioChange } from '@angular/material/legacy-radio'
import { GetDualScreenSettings } from 'src/app/misc/utils'

@Component({
	selector: "pocketlib-settings-page",
	templateUrl: "./settings-page.component.html",
	styleUrls: ['./settings-page.component.scss']
})
export class SettingsPageComponent {
	locale = enUS.settingsPage
	faCheck = faCheck
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	version: string = keys.version
	year = (new Date()).getFullYear()
	themeKeys: string[] = [keys.lightThemeKey, keys.darkThemeKey, keys.systemThemeKey]
	selectedTheme: string
	openLastReadBook: boolean = false
	updateMessage: string = ""
	searchForUpdates: boolean = false
	updateError: boolean = false
	noUpdateAvailable: boolean = false
	hideNoUpdateAvailable: boolean = false

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

		if (this.swUpdate.isEnabled && !this.dataService.updateInstalled) {
			// Check for updates
			this.updateMessage = this.locale.updateSearch
			this.searchForUpdates = true

			this.swUpdate.versionUpdates.subscribe((event: VersionEvent) => {
				if (event.type == "VERSION_DETECTED") {
					this.updateMessage = this.locale.installingUpdate
				} else if (event.type == "VERSION_READY") {
					this.searchForUpdates = false
					this.dataService.updateInstalled = true
				} else {
					this.searchForUpdates = false
					this.updateError = true
				}
			})

			if (!await this.swUpdate.checkForUpdate()) {
				this.searchForUpdates = false
				this.noUpdateAvailable = true

				setTimeout(() => {
					this.hideNoUpdateAvailable = true
				}, 3000)
			}
		}
	}

	onThemeRadioButtonSelected(event: MatRadioChange) {
		this.selectedTheme = event.value
		this.dataService.SetTheme(event.value)
		this.dataService.ApplyTheme(event.value)
	}

	onOpenLastReadBookToggleChange(checked: boolean) {
		this.openLastReadBook = !checked
		this.dataService.SetOpenLastReadBook(!checked)
	}

	ActivateUpdate() {
		window.location.reload()
	}
}