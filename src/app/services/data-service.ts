import { Injectable } from '@angular/core'
import { SwUpdate, VersionEvent } from '@angular/service-worker'
import * as localforage from 'localforage'
import {
	Dav,
	ApiResponse,
	GetAllTableObjects,
	PromiseHolder,
	isSuccessStatusCode
} from 'dav-js'
import * as DavUIComponents from 'dav-ui-components'
import { ApiService } from './api-service'
import { CachingService } from './caching-service'
import { Book } from '../models/Book'
import { EpubBook } from '../models/EpubBook'
import { PdfBook } from '../models/PdfBook'
import { GetAllBooks, GetBook } from '../models/BookManager'
import { Settings } from '../models/Settings'
import { BookOrder } from '../models/BookOrder'
import { Publisher } from '../models/Publisher'
import { Author } from 'src/app/models/Author'
import * as locales from 'src/locales/locales'
import {
	defaultLightStoreBookCoverUrl,
	defaultDarkStoreBookCoverUrl,
	defaultProfileImageUrl
} from 'src/constants/constants'
import { keys } from 'src/constants/keys'
import { environment } from 'src/environments/environment'
import {
	PublisherResource,
	PublisherField,
	PublisherListField,
	AuthorResource,
	AuthorField,
	AuthorListField,
	Category,
	CategoryListField,
	CategoryResource,
	Language,
	ListResponseData
} from 'src/app/misc/types'

@Injectable()
export class DataService {
	dav = Dav
	locale: string = navigator.language
	supportedLocale: string = "en"
	currentUrl: string = "/"
	navbarVisible: boolean = true
	books: Book[] = []
	currentBook: Book = null
	isMobile: boolean = false
	darkTheme: boolean = false
	bookPageVisible: boolean = false
	defaultStoreBookCover: string = this.darkTheme ? defaultDarkStoreBookCoverUrl : defaultLightStoreBookCoverUrl
	defaultProfileImageUrl: string = defaultProfileImageUrl
	settings: Settings
	settingsLoadPromiseHolder = new PromiseHolder<Settings>()
	settingsSyncPromiseHolder = new PromiseHolder<Settings>()
	bookOrder: BookOrder
	allBooksInitialLoadPromiseHolder = new PromiseHolder()
	syncFinished: boolean = false
	userPromiseHolder = new PromiseHolder()
	userPublisher: Publisher = null
	userPublisherPromiseHolder = new PromiseHolder<Publisher>()
	userAuthor: Author = null
	userAuthorPromiseHolder = new PromiseHolder<Author>()
	adminPublishers: Publisher[] = []
	adminPublishersPromiseHolder = new PromiseHolder<Publisher[]>()
	adminAuthors: Author[] = []
	adminAuthorsPromiseHolder = new PromiseHolder<Author[]>()
	userIsAdmin: boolean = false
	categories: Category[] = []
	categoriesPromiseHolder = new PromiseHolder()
	settingsCache: {
		[key: string]: any
	} = {}
	updateInstalled: boolean = false

	constructor(
		private apiService: ApiService,
		private cachingService: CachingService,
		private swUpdate: SwUpdate
	) {
		// Set the supported locale
		if (this.locale.startsWith("de")) {
			this.supportedLocale = "de"
		} else {
			this.supportedLocale = "en"
		}

		if (this.swUpdate.isEnabled) {
			// Check for updates
			this.swUpdate.versionUpdates.subscribe((event: VersionEvent) => {
				if (event.type == "VERSION_READY") {
					this.updateInstalled = true
				}
			})

			this.swUpdate.checkForUpdate()
		}
	}

	async LoadAuthorOfUser() {
		await this.userPromiseHolder.AwaitResult()

		if (this.dav.isLoggedIn) {
			if (environment.admins.includes(this.dav.user.Id)) {
				// Load the publishers of the admin
				this.adminPublishers = []

				let listPublishersResponse = await this.apiService.ListPublishers({
					fields: [
						PublisherListField.items_uuid,
						PublisherListField.items_name,
						PublisherListField.items_description,
						PublisherListField.items_websiteUrl,
						PublisherListField.items_facebookUsername,
						PublisherListField.items_instagramUsername,
						PublisherListField.items_twitterUsername,
						PublisherListField.items_logo
					]
				})

				if (isSuccessStatusCode(listPublishersResponse.status)) {
					let listPublishersResponseData = (listPublishersResponse as ApiResponse<ListResponseData<PublisherResource>>).data

					for (let item of listPublishersResponseData.items) {
						this.adminPublishers.push(
							new Publisher(
								item,
								await this.GetStoreLanguages(),
								this.apiService,
								this.cachingService
							)
						)
					}
				}

				// Load the authors of the admin
				this.adminAuthors = []
				let authorPage = 0
				let authorPages = 1

				while (authorPages > authorPage) {
					authorPage++

					let listAuthorsResponse = await this.apiService.ListAuthors({
						mine: true,
						fields: [
							AuthorListField.pages,
							AuthorListField.items_uuid,
							AuthorListField.items_firstName,
							AuthorListField.items_lastName,
							AuthorListField.items_websiteUrl,
							AuthorListField.items_facebookUsername,
							AuthorListField.items_instagramUsername,
							AuthorListField.items_twitterUsername,
							AuthorListField.items_profileImage
						],
						languages: await this.GetStoreLanguages(),
						page: authorPage
					})

					if (isSuccessStatusCode(listAuthorsResponse.status)) {
						let listAuthorsResponseData = (listAuthorsResponse as ApiResponse<ListResponseData<AuthorResource>>).data
						authorPages = listAuthorsResponseData.pages

						for (let item of listAuthorsResponseData.items) {
							this.adminAuthors.push(
								new Author(
									item,
									await this.GetStoreLanguages(),
									this.apiService,
									this.cachingService
								)
							)
						}
					} else {
						break
					}
				}
			} else {
				// Try to get the author of the user
				let authorResponse = await this.apiService.RetrieveAuthor({
					uuid: "mine",
					fields: [
						AuthorField.uuid,
						AuthorField.firstName,
						AuthorField.lastName,
						AuthorField.websiteUrl,
						AuthorField.facebookUsername,
						AuthorField.instagramUsername,
						AuthorField.twitterUsername,
						AuthorField.profileImage
					],
					languages: await this.GetStoreLanguages()
				})

				if (isSuccessStatusCode(authorResponse.status)) {
					let authorResponseData = (authorResponse as ApiResponse<AuthorResource>).data

					this.userAuthor = new Author(
						authorResponseData,
						await this.GetStoreLanguages(),
						this.apiService,
						this.cachingService
					)
				} else {
					// Try to get the publisher of the user
					let publisherResponse = await this.apiService.RetrievePublisher({
						uuid: "mine",
						fields: [
							PublisherField.uuid,
							PublisherField.name,
							PublisherField.description,
							PublisherField.websiteUrl,
							PublisherField.facebookUsername,
							PublisherField.instagramUsername,
							PublisherField.twitterUsername,
							PublisherField.logo
						]
					})

					if (isSuccessStatusCode(publisherResponse.status)) {
						let publisherResponseData = (publisherResponse as ApiResponse<PublisherResource>).data

						this.userPublisher = new Publisher(
							publisherResponseData,
							await this.GetStoreLanguages(),
							this.apiService,
							this.cachingService
						)
					}
				}
			}
		}

		this.userPublisherPromiseHolder.Resolve(this.userPublisher)
		this.userAuthorPromiseHolder.Resolve(this.userAuthor)
		this.adminPublishersPromiseHolder.Resolve(this.adminPublishers)
		this.adminAuthorsPromiseHolder.Resolve(this.adminAuthors)
	}

	async LoadCategories() {
		// Get the categories
		this.categories = []

		let response = await this.apiService.ListCategories({
			fields: [CategoryListField.items_key, CategoryListField.items_name],
			languages: await this.GetStoreLanguages()
		})

		if (isSuccessStatusCode(response.status)) {
			let responseData = (response as ApiResponse<ListResponseData<CategoryResource>>).data

			for (let category of responseData.items) {
				this.categories.push({
					key: category.key,
					name: category.name?.value,
					language: category.name?.language
				})
			}
		}

		// Sort the categories by name
		this.categories.sort((a: Category, b: Category) => a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1)

		this.categoriesPromiseHolder.Resolve()
	}

	async LoadAllBooks() {
		this.books = await GetAllBooks(this.bookOrder)
	}

	MoveBookToFirstPosition(uuid: string) {
		let i = this.books.findIndex(b => b.uuid == uuid)
		if (i == -1) return

		let book = this.books[i]
		this.books.splice(i, 1)
		this.books.unshift(book)
	}

	async ReloadBook(uuid: string) {
		// The book was updated in the database. Get it and replace the old book in the list with the new one
		let newBook = await GetBook(uuid)
		if (newBook == null) return

		// Replace or add the book
		let i = this.books.findIndex(b => b.uuid == newBook.uuid)

		if (i !== -1) {
			let book = this.books[i]

			book.file = newBook.file
			book.storeBook = newBook.storeBook
			book.belongsToUser = newBook.belongsToUser
			book.purchase = newBook.purchase

			if (book instanceof EpubBook && newBook instanceof EpubBook) {
				book.chapter = newBook.chapter
				book.progress = newBook.progress
				book.totalProgress = newBook.totalProgress
				book.chapterPercentages = newBook.chapterPercentages
				book.bookmarks = newBook.bookmarks
			} else if (book instanceof PdfBook && newBook instanceof PdfBook) {
				book.title = newBook.title
				book.page = newBook.page
				book.totalProgress = newBook.totalProgress
				book.bookmarks = newBook.bookmarks
				book.zoom = newBook.zoom
			}
		} else {
			this.books.push(newBook)
		}
	}

	async ReloadBookByFile(uuid: string) {
		// Find the book with the file uuid
		let tableObjects = await GetAllTableObjects(environment.bookTableId, false)
		let bookObject = tableObjects.find(obj => obj.GetPropertyValue(keys.bookTableFileKey) == uuid)
		if (!bookObject) return

		await this.ReloadBook(bookObject.Uuid)
	}

	GetFullLanguage(language: Language): string {
		let languagesLocale = this.GetLocale().misc.languages

		switch (language) {
			case Language.de:
				return languagesLocale.de
			default:
				return languagesLocale.en
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

	async SetStoreLanguages(languages: Language[]) {
		await localforage.setItem(keys.settingsStoreLanguagesKey, languages)
		this.settingsCache[keys.settingsStoreLanguagesKey] = languages
	}

	async GetStoreLanguages(): Promise<Language[]> {
		let defaultLanguages = []
		let l = this.locale.toLowerCase()

		if (l.startsWith("de")) {
			defaultLanguages = [Language.de, Language.en]
		} else {
			defaultLanguages = [Language.en, Language.de]
		}

		return this.GetSetting<Language[]>(
			keys.settingsStoreLanguagesKey,
			defaultLanguages
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