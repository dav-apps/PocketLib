import { Component } from "@angular/core"
import { SwUpdate, VersionEvent } from "@angular/service-worker"
import { faCheck } from "@fortawesome/pro-light-svg-icons"
import { DropdownOption, DropdownOptionType } from "dav-ui-components"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"
import { SettingsService } from "src/app/services/settings-service"
import { Language } from "src/app/misc/types"
import { keys } from "src/constants/keys"

interface LanguageOption {
	key: Language
	label: string
	checked: boolean
	disabled: boolean
}

@Component({
	templateUrl: "./settings-page.component.html",
	styleUrl: "./settings-page.component.scss",
	standalone: false
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
	languageOptions: LanguageOption[] = []
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
	}

	async ngOnInit() {
		// Init the preferred languages setting
		let languages = await this.settingsService.getStoreLanguages()

		for (let language of Object.keys(Language)) {
			let lang = language as Language
			let checked = languages.includes(lang)

			this.languageOptions.push({
				key: lang,
				label: this.localizationService.getFullLanguage(lang),
				checked,
				disabled: checked && languages.length == 1
			})
		}

		// Set the openLastReadBook toggle
		this.openLastReadBook = await this.settingsService.getOpenLastReadBook()

		// Select the correct theme
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

	async languageCheckboxChange(event: CustomEvent, language: LanguageOption) {
		let checked = event.detail.checked
		language.checked = checked

		// Get & save all languages
		let languages: Language[] = []
		let checkedLanguagesCount = 0

		for (let languageOption of this.languageOptions) {
			if (languageOption.checked) {
				languages.push(languageOption.key)
				checkedLanguagesCount++
			}

			languageOption.disabled = false
		}

		// If only one language is checked, disable it
		if (checkedLanguagesCount == 1) {
			for (let languageOption of this.languageOptions) {
				if (languageOption.checked) {
					languageOption.disabled = true
				}
			}
		}

		await this.settingsService.setStoreLanguages(languages)

		window.dispatchEvent(
			new CustomEvent("preferred-languages-setting-changed")
		)
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
