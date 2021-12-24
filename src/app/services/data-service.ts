import { Injectable, ElementRef } from '@angular/core'
import * as localforage from 'localforage'
import {
	Dav,
	ApiResponse,
	GetAllTableObjects,
	PromiseHolder
} from 'dav-js'
import * as DavUIComponents from 'dav-ui-components'
import { ApiService } from './api-service'
import { Book } from '../models/Book'
import { GetAllBooks, GetBook } from '../models/BookManager'
import { Settings } from '../models/Settings'
import * as locales from 'src/locales/locales'
import {
	defaultLightStoreBookCoverUrl,
	defaultDarkStoreBookCoverUrl,
	defaultProfileImageUrl
} from 'src/constants/constants'
import { keys } from 'src/constants/keys'
import { environment } from 'src/environments/environment'
import { Author, Category } from 'src/app/misc/types'

@Injectable()
export class DataService {
	dav = Dav
	locale: string = navigator.language
	supportedLocale: string = "en"
	currentUrl: string = "/"
	private _navbarVisible: boolean = true
	get navbarVisible(): boolean {
		return this._navbarVisible
	}
	set navbarVisible(value: boolean) {
		this._navbarVisible = value
		this.UpdateBottomToolbarVisibility()
	}
	bottomToolbarVisible: boolean = false
	books: Book[] = []
	currentBook: Book = null
	darkTheme: boolean = false
	smallWindow: boolean = false
	defaultStoreBookCover: string = this.darkTheme ? defaultDarkStoreBookCoverUrl : defaultLightStoreBookCoverUrl
	defaultProfileImageUrl: string = defaultProfileImageUrl
	settings: Settings
	settingsLoadPromiseHolder = new PromiseHolder<Settings>()
	settingsSyncPromiseHolder = new PromiseHolder<Settings>()
	allBooksInitialLoadPromiseHolder = new PromiseHolder()
	syncFinished: boolean = false
	userPromiseHolder = new PromiseHolder()
	userAuthor: Author = null
	userAuthorPromiseHolder = new PromiseHolder<Author>()
	adminAuthors: Author[] = []
	adminAuthorsPromiseHolder = new PromiseHolder<Author[]>()
	userIsAdmin: boolean = false
	storePageContentContainer: ElementRef<HTMLDivElement>
	sideNavOpened: boolean = false
	contentHeight: number = 200
	categories: Category[] = []
	categoriesPromiseHolder = new PromiseHolder()
	settingsCache: {
		[key: string]: any
	} = {}
	updateInstalled: boolean = false

	constructor(
		private apiService: ApiService
	) {
		// Set the supported locale
		if (this.locale.startsWith("de")) {
			this.supportedLocale = "de"
		} else {
			this.supportedLocale = "en"
		}
	}

	async LoadAuthorOfUser() {
		await this.userPromiseHolder.AwaitResult()

		if (this.dav.isLoggedIn) {
			let response = await this.apiService.GetAuthorOfUser()

			if (response.status == 200) {
				let responseData = (response as ApiResponse<any>).data

				if (responseData.authors) {
					this.adminAuthors = []

					for (let author of responseData.authors) {
						this.adminAuthors.push({
							uuid: author.uuid,
							firstName: author.first_name,
							lastName: author.last_name,
							websiteUrl: author.website_url,
							facebookUsername: author.facebook_username,
							instagramUsername: author.instagram_username,
							twitterUsername: author.twitter_username,
							bios: author.bios,
							collections: author.collections,
							series: author.series,
							profileImage: author.profile_image,
							profileImageBlurhash: author.profile_image_blurhash
						})
					}
				} else {
					this.userAuthor = {
						uuid: responseData.uuid,
						firstName: responseData.first_name,
						lastName: responseData.last_name,
						websiteUrl: responseData.website_url,
						facebookUsername: responseData.facebook_username,
						instagramUsername: responseData.instagram_username,
						twitterUsername: responseData.twitter_username,
						bios: responseData.bios,
						collections: responseData.collections,
						series: responseData.series,
						profileImage: responseData.profile_image,
						profileImageBlurhash: responseData.profile_image_blurhash
					}
				}
			} else {
				this.userAuthor = null
				this.adminAuthors = []
			}
		}

		this.userAuthorPromiseHolder.Resolve(this.userAuthor)
		this.adminAuthorsPromiseHolder.Resolve(this.adminAuthors)
	}

	async LoadCategories() {
		// Get the categories
		let getCategoriesResponse = await this.apiService.GetCategories()
		this.categories = []

		if (getCategoriesResponse.status == 200) {
			let getCategoriesResponseData = (getCategoriesResponse as ApiResponse<any>).data

			for (let category of getCategoriesResponseData.categories) {
				let currentLanguageIndex = FindAppropriateLanguage(this.locale.slice(0, 2), category.names)
				let currentLanguage = category.names[currentLanguageIndex]

				this.categories.push({
					key: category.key,
					name: currentLanguage.name,
					language: currentLanguage.language
				})
			}
		}

		// Sort the categories by name
		this.categories.sort((a: Category, b: Category) => a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1)

		this.categoriesPromiseHolder.Resolve()
	}

	async LoadAllBooks() {
		this.books = await GetAllBooks()
	}

	async ReloadBook(uuid: string) {
		// The book was updated in the database. Get it and replace the old book in the list with the new one
		let book = await GetBook(uuid)
		if (!book) return

		// Replace or add the book
		let i = this.books.findIndex(b => b.uuid == book.uuid)

		if (i !== -1) {
			this.books[i] = book
		} else {
			this.books.push(book)
		}
	}

	async ReloadBookByFile(uuid: string) {
		// Find the book with the file uuid
		let tableObjects = await GetAllTableObjects(environment.bookTableId, false)
		let bookObject = tableObjects.find(obj => obj.GetPropertyValue(keys.bookTableFileKey) == uuid)
		if (!bookObject) return

		await this.ReloadBook(bookObject.Uuid)
	}

	GetFullLanguage(language: string): string {
		let languagesLocale = this.GetLocale().misc.languages

		switch (language) {
			case "en":
				return languagesLocale.en
			case "de":
				return languagesLocale.de
		}
	}

	GetLocale() {
		let l = this.locale.toLowerCase()

		if (l.startsWith("en")) {            // en
			if (l == "en-gb") return locales.enGB
			else return locales.enUS
		} else if (l.startsWith("de")) {      // de
			if (l == "de-at") return locales.deAT
			else if (l == "de-ch") return locales.deCH
			else return locales.deDE
		}

		return locales.enUS
	}

	UpdateBottomToolbarVisibility() {
		this.bottomToolbarVisible = this.navbarVisible && this.smallWindow
	}

	ScrollStoreContentToTop() {
		if (this.storePageContentContainer != null){
			this.storePageContentContainer.nativeElement.scrollTo(0, 0)
		}
	}

	async ApplyTheme(theme?: string) {
		if (!theme) {
			// Get the theme from the settings
			theme = await this.GetTheme()
		}

		switch (theme) {
			case keys.darkThemeKey:
				this.darkTheme = true
				break
			case keys.systemThemeKey:
				// Get the browser theme
				let darkTheme = false

				if (window.matchMedia) {
					let colorScheme = window.matchMedia('(prefers-color-scheme: dark)')

					darkTheme = colorScheme.matches
					colorScheme.onchange = () => this.ApplyTheme()
				}

				this.darkTheme = darkTheme
				break
			default:
				// Light theme
				this.darkTheme = false
				break
		}

		document.body.setAttribute(
			keys.themeKey,
			this.darkTheme ? keys.darkThemeKey : keys.lightThemeKey
		)

		this.defaultStoreBookCover = this.darkTheme ? defaultDarkStoreBookCoverUrl : defaultLightStoreBookCoverUrl
		DavUIComponents.setTheme(this.darkTheme)
	}

	//#region Settings
	async SetTheme(value: string) {
		await localforage.setItem(keys.settingsThemeKey, value)
		this.settingsCache[keys.settingsThemeKey] = value
	}

	async GetTheme(): Promise<string> {
		return this.GetSetting<string>(
			keys.settingsThemeKey,
			keys.settingsThemeDefault
		)
	}

	async SetOpenLastReadBook(value: boolean) {
		await localforage.setItem(keys.settingsOpenLastReadBookKey, value)
		this.settingsCache[keys.settingsOpenLastReadBookKey] = value
	}

	async GetOpenLastReadBook(): Promise<boolean> {
		return this.GetSetting<boolean>(
			keys.settingsOpenLastReadBookKey,
			keys.settingsOpenLastReadBookDefault
		)
	}

	async SetStoreLanguages(languages: string[]) {
		await localforage.setItem(keys.settingsStoreLanguagesKey, languages)
		this.settingsCache[keys.settingsStoreLanguagesKey] = languages
	}

	async GetStoreLanguages(): Promise<string[]> {
		return this.GetSetting<string[]>(
			keys.settingsStoreLanguagesKey,
			["en", "de"]
		)
	}

	private async GetSetting<T>(key: string, defaultValue: T): Promise<T> {
		let cachedValue = this.settingsCache[key]
		if (cachedValue != null) return cachedValue
		
		let value = await localforage.getItem(key) as T
		if (value == null) value = defaultValue
		
		this.settingsCache[key] = value
		return value
	}
	//#endregion
}

export function FindElement(currentElement: Element, tagName: string): Element {
	if (currentElement.tagName.toLowerCase() == tagName) return currentElement

	for (let i = 0; i < currentElement.children.length; i++) {
		let child = currentElement.children.item(i)

		let foundElement = FindElement(child, tagName)
		if (foundElement) return foundElement
	}

	return null
}

export function FindAppropriateLanguage(targetLanguage: string, objects: { language: string }[]): number {
	if (objects.length == 0) return -1
	if (objects.length == 1) return 0

	// Try to get the name of the target language
	let i = objects.findIndex(n => n.language == targetLanguage)
	if (i != -1) return i

	// Try to get the name of the default language
	i = objects.findIndex(n => n.language == "en")
	if (i != -1) return i

	// Return the first name
	return 0
}

export function GetContentAsInlineSource(content: string, contentType: string): string {
	return `data:${contentType};base64,${btoa(content)}`
}