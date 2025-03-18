import { Injectable, Inject, PLATFORM_ID } from "@angular/core"
import { isPlatformBrowser } from "@angular/common"
import * as localforage from "localforage"
import { getLanguage } from "src/app/misc/utils"
import { keys } from "src/constants/keys"
import { Language, VisitedBook } from "src/app/misc/types"

@Injectable()
export class SettingsService {
	cache: {
		[key: string]: any
	} = {}

	constructor(@Inject(PLATFORM_ID) private platformId: object) {}

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

	async getStoreLanguages(): Promise<Language[]> {
		let defaultLanguages = []

		if (getLanguage(isPlatformBrowser(this.platformId)) == Language.de) {
			defaultLanguages = [Language.de, Language.en]
		} else {
			defaultLanguages = [Language.en]
		}

		return this.getSetting<Language[]>(
			keys.settingsStoreLanguagesKey,
			defaultLanguages
		)
	}
	//#endregion

	//#region SearchQueries
	async setSearchQueries(searchQueries: string[]) {
		await localforage.setItem(keys.settingsSearchQueriesKey, searchQueries)
		this.cache[keys.settingsSearchQueriesKey] = searchQueries
	}

	async getSearchQueries(): Promise<string[]> {
		return this.getSetting<string[]>(keys.settingsSearchQueriesKey, [])
	}

	async addSearchQuery(searchQuery: string) {
		let searchQueries = await this.getSearchQueries()
		let i = searchQueries.findIndex(q => q == searchQuery)

		if (i == -1) {
			// Add the new search query
			searchQueries.unshift(searchQuery)
		} else {
			// Move the search query to the first position
			searchQueries.splice(i, 1)
			searchQueries.unshift(searchQuery)
		}

		await this.setSearchQueries(searchQueries)
	}

	async removeSearchQuery(searchQuery: string) {
		let searchQueries = await this.getSearchQueries()

		let i = searchQueries.findIndex(q => q == searchQuery)
		if (i != -1) searchQueries.splice(i, 1)

		await this.setSearchQueries(searchQueries)
	}
	//#endregion

	//#region VisitedBooks
	async setVisitedBooks(visitedBooks: VisitedBook[]) {
		await localforage.setItem(keys.settingsVisitedBooksKey, visitedBooks)
		this.cache[keys.settingsVisitedBooksKey] = visitedBooks
	}

	async getVisitedBooks(): Promise<VisitedBook[]> {
		return this.getSetting<VisitedBook[]>(keys.settingsVisitedBooksKey, [])
	}

	async addVisitedBook(visitedBook: VisitedBook) {
		let visitedBooks = await this.getVisitedBooks()
		let i = visitedBooks.findIndex(b => b.slug == visitedBook.slug)

		if (i == -1) {
			// Add the new item
			visitedBooks.unshift(visitedBook)
		} else {
			// Move the item to the first position
			visitedBooks.splice(i, 1)
			visitedBooks.unshift(visitedBook)
		}

		await this.setVisitedBooks(visitedBooks)
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
