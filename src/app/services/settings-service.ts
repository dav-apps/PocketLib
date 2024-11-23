import { Injectable } from "@angular/core"
import * as localforage from "localforage"
import { keys } from "src/constants/keys"
import { Language } from "src/app/misc/types"

@Injectable()
export class SettingsService {
	cache: {
		[key: string]: any
	} = {}

	//#region Theme
	async setTheme(value: string) {
		await localforage.setItem(keys.settingsThemeKey, value)
		this.cache[keys.settingsThemeKey] = value
	}

	async getTheme(): Promise<string> {
		return this.getSetting<string>(
			keys.settingsThemeKey,
			keys.settingsThemeDefault
		)
	}
	//#endregion

	//#region openLastReadBook
	async setOpenLastReadBook(value: boolean) {
		await localforage.setItem(keys.settingsOpenLastReadBookKey, value)
		this.cache[keys.settingsOpenLastReadBookKey] = value
	}

	async getOpenLastReadBook(): Promise<boolean> {
		return this.getSetting<boolean>(
			keys.settingsOpenLastReadBookKey,
			keys.settingsOpenLastReadBookDefault
		)
	}
	//#endregion

	//#region storeLanguages
	async setStoreLanguages(languages: Language[]) {
		await localforage.setItem(keys.settingsStoreLanguagesKey, languages)
		this.cache[keys.settingsStoreLanguagesKey] = languages
	}

	async getStoreLanguages(locale: string): Promise<Language[]> {
		let defaultLanguages = []

		if (locale.toLowerCase().startsWith("de")) {
			defaultLanguages = [Language.de, Language.en]
		} else {
			defaultLanguages = [Language.en, Language.de]
		}

		return this.getSetting<Language[]>(
			keys.settingsStoreLanguagesKey,
			defaultLanguages
		)
	}
	//#endregion

	private async getSetting<T>(key: string, defaultValue: T): Promise<T> {
		let cachedValue = this.cache[key]
		if (cachedValue != null) return cachedValue

		let value = (await localforage.getItem(key)) as T
		if (value == null) value = defaultValue

		this.cache[key] = value
		return value
	}
}
