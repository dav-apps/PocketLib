import { Injectable, Inject, Optional, PLATFORM_ID, DOCUMENT } from "@angular/core"
import { NavigationEnd, Router } from "@angular/router"
import { canonicalUrl } from "../misc/seo"
import { SwUpdate, VersionEvent } from "@angular/service-worker"
import { Title, Meta } from "@angular/platform-browser"
import { Dav, GetAllTableObjects, PromiseHolder } from "dav-js"
import * as DavUIComponents from "dav-ui-components"
import { ApiService } from "src/app/services/api-service"
import { SettingsService } from "src/app/services/settings-service"
import { Book } from "../models/Book"
import { EpubBook } from "../models/EpubBook"
import { PdfBook } from "../models/PdfBook"
import { GetAllBooks, GetBook } from "../models/BookManager"
import { Settings } from "../models/Settings"
import { BookOrder } from "../models/BookOrder"
import { Publisher } from "../models/Publisher"
import { Author } from "src/app/models/Author"
import { LocalizationService } from "src/app/services/localization-service"
import { RESPONSE_STATE, ResponseState } from "src/app/misc/tokens"
import {
	defaultLightStoreBookCoverUrl,
	defaultDarkStoreBookCoverUrl,
	defaultProfileImageUrl
} from "src/constants/constants"
import { keys } from "src/constants/keys"
import { environment } from "src/environments/environment"
import { Category } from "src/app/misc/types"

@Injectable()
export class DataService {
	dav = Dav
	currentUrl: string = "/"
	private canonicalPath: string | null = null
	navbarVisible: boolean = true
	books: Book[] = []
	currentBook: Book = null
	isMobile: boolean = false
	darkTheme: boolean = false
	bookPageVisible: boolean = false
	loadingScreenVisible: boolean = false
	loadingScreenMessage: string = ""
	simpleLoadingScreenVisible: boolean = false
	defaultStoreBookCover: string = this.darkTheme
		? defaultDarkStoreBookCoverUrl
		: defaultLightStoreBookCoverUrl
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
	updateInstalled: boolean = false
	windows: boolean = false
	contentContainer: HTMLDivElement = null

	constructor(
		private apiService: ApiService,
		private settingsService: SettingsService,
		private localizationService: LocalizationService,
		private swUpdate: SwUpdate,
		private title: Title,
		private meta: Meta,
		private router: Router,
		@Inject(PLATFORM_ID) private platformId: object,
		@Inject(DOCUMENT) private document: Document,
		@Optional() @Inject(RESPONSE_STATE) private responseState: ResponseState
	) {
		// Query-only navigation can reuse a page without calling setMeta again.
		this.router.events.subscribe(event => {
			if (event instanceof NavigationEnd && this.canonicalPath != null) {
				this.updateCanonical(event.urlAfterRedirects)
			}
		})

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

				let listPublishersResponse = await this.apiService.listPublishers(
					`
						items {
							uuid
						}
					`
				)

				let listPublishersResponseData =
					listPublishersResponse.data.listPublishers

				if (listPublishersResponseData != null) {
					for (let item of listPublishersResponseData.items) {
						this.adminPublishers.push(
							await Publisher.Retrieve(
								item.uuid,
								await this.settingsService.getStoreLanguages(),
								this.apiService
							)
						)
					}
				}

				// Load the authors of the admin
				this.adminAuthors = []
				let totalItems = 0
				let limit = 20
				let offset = 0

				do {
					let listAuthorsResponse = await this.apiService.listAuthors(
						`
							total
							items {
								uuid
							}
						`,
						{
							mine: true,
							limit,
							offset
						}
					)

					let listAuthorsResponseData =
						listAuthorsResponse.data.listAuthors

					if (listAuthorsResponseData != null) {
						totalItems = listAuthorsResponseData.total
						offset += limit

						for (let item of listAuthorsResponseData.items) {
							this.adminAuthors.push(
								await Author.Retrieve(
									item.uuid,
									await this.settingsService.getStoreLanguages(),
									this.apiService
								)
							)
						}
					} else {
						break
					}
				} while (totalItems > offset)
			} else {
				// Try to get the author of the user
				this.userAuthor = await Author.Retrieve(
					"mine",
					await this.settingsService.getStoreLanguages(),
					this.apiService
				)

				if (this.userAuthor == null) {
					// Try to get the publisher of the user
					this.userPublisher = await Publisher.Retrieve(
						"mine",
						await this.settingsService.getStoreLanguages(),
						this.apiService
					)
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

		try {
			let listCategoriesResponse = await this.apiService.listCategories(
				`
					total
					items {
						uuid
						key
						name(language: $language) {
							name
							language
						}
					}
				`,
				{
					limit: 100,
					language: this.localizationService.language
				}
			)

			for (let category of listCategoriesResponse.data.listCategories
				.items) {
				this.categories.push({
					key: category.key,
					name: category.name.name,
					language: category.name.language
				})
			}

			// Sort the categories by name
			this.categories.sort((a: Category, b: Category) =>
				a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
			)
		} finally {
			// Has to happen even when the request failed. Whoever awaits this
			// holder - the store book page, the category pages - would stop
			// rendering halfway through otherwise.
			this.categoriesPromiseHolder.Resolve()
		}
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
		let tableObjects = await GetAllTableObjects(
			environment.bookTableId,
			false
		)
		let bookObject = tableObjects.find(
			obj => obj.GetPropertyValue(keys.bookTableFileKey) == uuid
		)
		if (!bookObject) return

		await this.ReloadBook(bookObject.Uuid)
	}

	async ApplyTheme(theme?: string) {
		if (!theme) {
			// Get the theme from the settings
			theme = await this.settingsService.getTheme()
		}

		switch (theme) {
			case keys.darkThemeKey:
				this.darkTheme = true
				break
			case keys.systemThemeKey:
				// Get the browser theme
				let darkTheme = false

				if (window.matchMedia) {
					let colorScheme = window.matchMedia(
						"(prefers-color-scheme: dark)"
					)

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

		this.defaultStoreBookCover = this.darkTheme
			? defaultDarkStoreBookCoverUrl
			: defaultLightStoreBookCoverUrl

		DavUIComponents.setTheme(
			this.darkTheme
				? DavUIComponents.Theme.dark
				: DavUIComponents.Theme.light
		)

		// Notify the Windows app of the theme
		if (window["chrome"] && window["chrome"].webview) {
			window["chrome"].webview.postMessage(
				JSON.stringify({
					theme: this.darkTheme ? keys.darkThemeKey : keys.lightThemeKey
				})
			)
		}
	}

	setMeta(params?: {
		title?: string
		description?: string
		image?: string
		url?: string
		type?: string
		language?: string
		structuredData?: object | object[]
	}) {
		// Callers pass through values that are often empty strings rather than
		// null - an author without a biography, a book without a cover - and ??
		// would keep those, leaving the tag with an empty content attribute
		const title = notBlank(params?.title) ?? "PocketLib"
		const description = (
			notBlank(params?.description) ??
			"PocketLib is a simple and modern ebook reader"
		).replace(/\s+/g, " ").trim()
		const image =
			notBlank(params?.image) ??
			"https://pocketlib.app/assets/icons/icon-128x128.png"
		// Falling back to "" would canonicalise every page that calls setMeta
		// without a url - the store start page among them - onto the home page.
		// currentUrl is the route being navigated to, without the query string.
		this.canonicalPath = params?.url ?? this.currentUrl
		const navigationUrl = this.router.getCurrentNavigation()?.extractedUrl.toString() ?? this.router.url
		const absoluteUrl = canonicalUrl(this.canonicalPath, navigationUrl)
		const type = params?.type ?? "website"

		// The language of the content, not of the interface: a German book stays
		// German whichever language the surrounding app is displayed in. Pages
		// that do not know theirs fall back to the interface language.
		const language =
			normalizeLanguage(params?.language) ??
			this.localizationService.language

		this.title.setTitle(title)
		this.document.documentElement.setAttribute("lang", language)
		this.setCanonicalUrl(absoluteUrl)

		// Always written, so that navigating from a book to a page without any
		// leaves no stale markup behind
		this.setStructuredData(params?.structuredData ?? null)

		// Pass the whole definition instead of a selector. updateTag falls back
		// to addTag when nothing matches, and addTag only writes the attributes
		// it is given - passing just { content } used to produce a nameless
		// <meta content="..."> for every tag that index.html does not declare,
		// which is why the pages had no description at all.
		this.meta.updateTag({ name: "description", content: description })

		this.meta.updateTag({ name: "twitter:title", content: title })
		this.meta.updateTag({ name: "twitter:description", content: description })
		this.meta.updateTag({ name: "twitter:image", content: image })

		this.meta.updateTag({ property: "og:title", content: title })
		this.meta.updateTag({ property: "og:description", content: description })
		this.meta.updateTag({ property: "og:image", content: image })
		this.meta.updateTag({ property: "og:url", content: absoluteUrl })
		this.meta.updateTag({ property: "og:type", content: type })
		this.meta.updateTag({ property: "og:site_name", content: "PocketLib" })
		this.meta.updateTag({
			property: "og:locale",
			content: toOpenGraphLocale(language)
		})
	}

	/** Finish the loading state and present consistent metadata for missing pages. */
	setNotFound() {
		if (this.responseState != null) this.responseState.status = 404
		this.simpleLoadingScreenVisible = false
		const locale = this.localizationService.locale.notFoundPage
		this.setMeta({
			title: `${locale.headline} | PocketLib`,
			description: locale.description
		})
	}

	private updateCanonical(navigationUrl: string) {
		const url = canonicalUrl(this.canonicalPath, navigationUrl)
		this.setCanonicalUrl(url)
		this.meta.updateTag({ property: "og:url", content: url })
	}

	/**
	 * Angular has a Meta service but no equivalent for link tags, so the
	 * canonical one is kept in sync by hand. Without it the tracking parameters
	 * that ChatGPT and Perplexity append, and the trailing slash variants the
	 * server answers to, are all indexable copies of the same page.
	 */
	private setCanonicalUrl(url: string) {
		let link = this.document.head.querySelector<HTMLLinkElement>(
			"link[rel='canonical']"
		)

		if (link == null) {
			link = this.document.createElement("link")
			link.setAttribute("rel", "canonical")
			this.document.head.appendChild(link)
		}

		link.setAttribute("href", url)
	}

	/**
	 * Writes the schema.org description of the page as JSON-LD, or removes it.
	 * This is the part of a store page a crawler can read without guessing:
	 * which of the numbers on it is the price, which string is the author.
	 */
	private setStructuredData(data: object | object[] | null) {
		let script = this.document.head.querySelector(
			"script[type='application/ld+json']"
		)

		if (data == null) {
			script?.remove()
			return
		}

		if (script == null) {
			script = this.document.createElement("script")
			script.setAttribute("type", "application/ld+json")
			this.document.head.appendChild(script)
		}

		// A description containing "</script>" would end the element early, so
		// the character that can start a tag never reaches the document as is
		script.textContent = JSON.stringify(data).replace(/</g, "\\u003c")
	}
}

/** Reduces a language tag like "de-AT" to the bare code the html lang needs */
function normalizeLanguage(language?: string): string | null {
	const code = language?.trim().slice(0, 2).toLowerCase()
	return code != null && /^[a-z]{2}$/.test(code) ? code : null
}

/** "de" -> "de_DE". Open Graph wants a full locale, not a language code. */
function toOpenGraphLocale(language: string): string {
	if (language == "en") return "en_US"
	return `${language}_${language.toUpperCase()}`
}

/** Treats an empty or whitespace only string like a missing value */
function notBlank(value?: string): string | null {
	return value != null && value.trim().length > 0 ? value : null
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

export function FindAppropriateLanguage(
	targetLanguage: string,
	objects: { language: string }[]
): number {
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

export function GetContentAsInlineSource(
	content: string,
	contentType: string
): string {
	return `data:${contentType};base64,${btoa(content)}`
}
