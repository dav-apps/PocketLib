import { Component } from "@angular/core"
import { SwUpdate, VersionEvent } from "@angular/service-worker"
import { faCheck } from "@fortawesome/pro-light-svg-icons"
import { DropdownOption, DropdownOptionType } from "dav-ui-components"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"
import { SettingsService } from "src/app/services/settings-service"
import { keys } from "src/constants/keys"

@Component({
	templateUrl: "./settings-page.component.html",
	styleUrls: ["./settings-page.component.scss"]
})
export class SettingsPageComponent {
	locale = this.localizationService.locale.settingsPage
	faCheck = faCheck
	version: string = keys.version
	year = new Date().getFullYear()
	openLastReadBook: boolean = false
	updateMessage: string = ""
	searchForUpdates: boolean = false
	updateError: boolean = false
	noUpdateAvailable: boolean = false
	hideNoUpdateAvailable: boolean = false
	selectedTheme: string = keys.systemThemeKey
	themeDropdownOptions: DropdownOption[] = [
		{
			key: keys.systemThemeKey,
			value: this.locale.systemTheme,
			type: DropdownOptionType.option
		},
		{
			key: keys.lightThemeKey,
			value: this.locale.lightTheme,
			type: DropdownOptionType.option
		},
		{
			key: keys.darkThemeKey,
			value: this.locale.darkTheme,
			type: DropdownOptionType.option
		}
	]

	constructor(
		public dataService: DataService,
		private localizationService: LocalizationService,
		private settingsService: SettingsService,
		private swUpdate: SwUpdate
	) {
		this.dataService.setMeta()

		this.themeDropdownOptions[0].value = this.locale.systemTheme
		this.themeDropdownOptions[1].value = this.locale.lightTheme
		this.themeDropdownOptions[2].value = this.locale.darkTheme
	}

	async ngOnInit() {
		// Set the openLastReadBook toggle
		this.openLastReadBook = await this.settingsService.getOpenLastReadBook()

		// Select the correct theme radio button
		this.selectedTheme = await this.settingsService.getTheme()

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
				} else if (event.type == "NO_NEW_VERSION_DETECTED") {
					this.searchForUpdates = false
				} else {
					this.searchForUpdates = false
					this.updateError = true
				}
			})

			if (!(await this.swUpdate.checkForUpdate())) {
				this.searchForUpdates = false
				this.noUpdateAvailable = true

				setTimeout(() => {
					this.hideNoUpdateAvailable = true
				}, 3000)
			}
		}
	}

	onOpenLastReadBookToggleChange(checked: boolean) {
		this.openLastReadBook = checked
		this.settingsService.setOpenLastReadBook(checked)
	}

	themeDropdownChange(event: CustomEvent) {
		let selectedKey = event.detail.key

		this.selectedTheme = selectedKey
		this.settingsService.setTheme(selectedKey)
		this.dataService.ApplyTheme(selectedKey)
	}

	ActivateUpdate() {
		window.location.reload()
	}
}
