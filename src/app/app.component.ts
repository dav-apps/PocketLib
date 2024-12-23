import {
	Component,
	HostListener,
	ViewChild,
	ElementRef,
	ChangeDetectorRef
} from "@angular/core"
import { Router, ActivatedRoute, NavigationStart } from "@angular/router"
import { HttpHeaders } from "@angular/common/http"
import { Apollo } from "apollo-angular"
import { HttpLink } from "apollo-angular/http"
import { InMemoryCache } from "@apollo/client/core"
import {
	faAddressCard as faAddressCardSolid,
	faBook as faBookSolid,
	faCircleUser as faCircleUserSolid,
	faGear as faGearSolid,
	faBagShopping as faBagShoppingSolid
} from "@fortawesome/free-solid-svg-icons"
import {
	faBook as faBookRegular,
	faCircleUser as faCircleUserRegular,
	faGear as faGearRegular,
	faBagShopping as faBagShoppingRegular,
	faMagnifyingGlass as faMagnifyingGlassRegular
} from "@fortawesome/pro-regular-svg-icons"
import { faAddressCard as faAddressCardLight } from "@fortawesome/pro-light-svg-icons"
import { Dav, TableObject } from "dav-js"
import * as DavUIComponents from "dav-ui-components"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { DavApiService } from "./services/dav-api-service"
import { RoutingService } from "./services/routing-service"
import { LocalizationService } from "./services/localization-service"
import { SettingsService } from "src/app/services/settings-service"
import { EpubBook } from "./models/EpubBook"
import { GetBookOrder } from "./models/BookOrder"
import { GetSettings } from "src/app/models/Settings"
import { dataIdFromObject, getLanguage } from "./misc/utils"
import { Language } from "./misc/types"
import {
	smallWindowMaxSize,
	davApiClientName,
	pocketlibApiClientName
} from "src/constants/constants"
import { environment } from "src/environments/environment"

@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss",
	standalone: false
})
export class AppComponent {
	locale = this.localizationService.locale.misc
	faCircleUserRegular = faCircleUserRegular
	faCircleUserSolid = faCircleUserSolid
	faGearRegular = faGearRegular
	faGearSolid = faGearSolid
	faBagShoppingRegular = faBagShoppingRegular
	faBagShoppingSolid = faBagShoppingSolid
	faAddressCardLight = faAddressCardLight
	faAddressCardSolid = faAddressCardSolid
	faBookRegular = faBookRegular
	faBookSolid = faBookSolid
	faMagnifyingGlassRegular = faMagnifyingGlassRegular
	@ViewChild("contentContainer")
	contentContainer: ElementRef<HTMLDivElement>
	libraryTabActive: boolean = false
	storeTabActive: boolean = false
	searchTabActive: boolean = false
	authorButtonSelected: boolean = false
	userButtonSelected: boolean = false
	settingsButtonSelected: boolean = false
	storeLanguages: Language[] = [Language.en]

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private davApiService: DavApiService,
		private routingService: RoutingService,
		private localizationService: LocalizationService,
		private settingsService: SettingsService,
		private router: Router,
		private activatedRoute: ActivatedRoute,
		private apollo: Apollo,
		private httpLink: HttpLink,
		private cd: ChangeDetectorRef
	) {
		DavUIComponents.setLocale(getLanguage())

		this.router.events.forEach(data => {
			if (data instanceof NavigationStart) {
				this.dataService.currentUrl = data.url.split("?")[0]

				this.libraryTabActive = this.dataService.currentUrl == "/"
				this.storeTabActive =
					this.dataService.currentUrl.startsWith("/store")
				this.searchTabActive = this.dataService.currentUrl == "/search"
				this.authorButtonSelected =
					this.dataService.currentUrl == "/author" ||
					this.dataService.currentUrl == "/publisher"
				this.userButtonSelected = this.dataService.currentUrl == "/user"
				this.settingsButtonSelected =
					this.dataService.currentUrl == "/settings"
			}
		})

		// Log the user in if there is an access token in the url
		this.activatedRoute.queryParams.subscribe(async params => {
			if (params["accessToken"]) {
				// Login with the access token
				await this.dataService.dav.Login(params["accessToken"])

				// Reload the page without accessToken in the url
				let url = new URL(window.location.href)
				url.searchParams.delete("accessToken")
				window.location.href = url.toString()
			}
		})
	}

	async ngOnInit() {
		this.setSize()
		this.dataService.ApplyTheme()
		await this.loadStoreLanguages()

		new Dav({
			environment: environment.environment,
			appId: environment.appId,
			tableIds: [
				environment.settingsTableId,
				environment.bookOrderTableId,
				environment.bookFileTableId,
				environment.bookTableId,
				environment.epubBookmarkTableId
			],
			callbacks: {
				UpdateAllOfTable: (tableId: number, changed: boolean) =>
					this.UpdateAllOfTable(tableId, changed),
				UpdateTableObject: (
					tableObject: TableObject,
					fileDownloaded: boolean = false
				) => this.UpdateTableObject(tableObject, fileDownloaded),
				UserLoaded: () => this.UserLoaded(),
				UserDownloaded: () => this.UserDownloaded(),
				AccessTokenRenewed: (accessToken: string) =>
					this.AccessTokenRenewed(accessToken),
				SyncFinished: () => this.SyncFinished()
			}
		})

		// Set the lang attribute of the html element
		let htmlElement = document.getElementsByTagName(
			"html"
		)[0] as HTMLHtmlElement
		if (htmlElement) htmlElement.setAttribute("lang", getLanguage())

		// Get the settings
		this.dataService.settings = await GetSettings()

		// Resolve the settings load promise
		this.dataService.settingsLoadPromiseHolder.Resolve(
			this.dataService.settings
		)

		if (this.router.url == "/?windows=true") {
			this.dataService.windows = true
			document.documentElement.style.setProperty(
				"--windows-title-bar-height",
				"28px"
			)
		}

		let url = this.router.url.split("?")[0]

		if ((await this.settingsService.getOpenLastReadBook()) && url == "/") {
			this.router.navigate(["loading"], { skipLocationChange: true })
		}

		// Get the book order
		this.dataService.bookOrder = await GetBookOrder()

		// Load the books
		this.dataService.LoadAllBooks().then(() => {
			this.dataService.allBooksInitialLoadPromiseHolder.Resolve()
		})

		// Load the categories
		await this.dataService.LoadCategories()
	}

	ngAfterViewInit() {
		this.setSize()
		this.cd.detectChanges()
		this.dataService.contentContainer = this.contentContainer.nativeElement
	}

	@HostListener("window:resize")
	setSize() {
		this.dataService.isMobile = window.innerWidth <= smallWindowMaxSize
	}

	@HostListener("window:preferred-languages-setting-changed")
	async loadStoreLanguages() {
		this.storeLanguages = await this.settingsService.getStoreLanguages()
	}

	navigateToLibraryPage() {
		this.routingService.navigateToLibraryPage()
	}

	navigateToStorePage() {
		this.routingService.navigateToStorePage()
	}

	navigateToSearchPage() {
		this.routingService.navigateToSearchPage()
	}

	navigateToAuthorPage() {
		this.routingService.navigateToAuthorPage()
	}

	navigateToUserPage() {
		this.routingService.navigateToUserPage()
	}

	navigateToSettingsPage() {
		this.routingService.navigateToSettingsPage()
	}

	navigateToBook(book: EpubBook) {
		// Check if the user can access the book
		if (book.storeBook && !this.dataService.dav.isLoggedIn) {
			// TODO: Show dialog
			return
		}

		// Open the book on the book page
		this.dataService.currentBook = book
		this.router.navigate(["book"])
	}

	setupApollo(accessToken: string) {
		this.apollo.removeClient(davApiClientName)
		this.apollo.removeClient(pocketlibApiClientName)

		this.apollo.create(
			{
				cache: new InMemoryCache({ dataIdFromObject }),
				link: this.httpLink.create({
					uri: environment.davApiUrl,
					headers: new HttpHeaders().set("Authorization", accessToken)
				})
			},
			davApiClientName
		)

		this.apollo.create(
			{
				cache: new InMemoryCache({ dataIdFromObject }),
				link: this.httpLink.create({
					uri: environment.pocketlibApiUrl,
					headers: new HttpHeaders().set("Authorization", accessToken)
				})
			},
			pocketlibApiClientName
		)

		this.davApiService.loadApolloClient()
		this.apiService.loadApolloClient()
	}

	//#region dav-js callback functions
	async UpdateAllOfTable(tableId: number, changed: boolean) {
		if (tableId == environment.settingsTableId) {
			// Reload the settings if it has changed
			if (changed) {
				this.dataService.settings = await GetSettings()
			}

			// Resolve the settings synced promise
			this.dataService.settingsSyncPromiseHolder.Resolve(
				this.dataService.settings
			)
		}
	}

	UpdateTableObject(
		tableObject: TableObject,
		fileDownloaded: boolean = false
	) {
		if (tableObject.TableId == environment.bookTableId) {
			// Reload the book
			this.dataService.ReloadBook(tableObject.Uuid)
		} else if (
			tableObject.TableId == environment.bookFileTableId &&
			fileDownloaded
		) {
			// Find the book with that file uuid and reload it
			this.dataService.ReloadBookByFile(tableObject.Uuid)
		}
	}

	UserLoaded() {
		this.dataService.userIsAdmin = environment.admins.includes(
			this.dataService.dav.user.Id
		)

		if (this.dataService.dav.isLoggedIn) {
			// Setup the apollo client with the access token
			this.setupApollo(this.dataService.dav.accessToken)
		}

		this.dataService.userPromiseHolder.Resolve()
	}

	async UserDownloaded() {
		// Load the author
		await this.dataService.LoadAuthorOfUser()
		this.dataService.userIsAdmin = environment.admins.includes(
			this.dataService.dav.user.Id
		)
	}

	AccessTokenRenewed(accessToken: string) {
		this.setupApollo(accessToken)
	}

	SyncFinished() {
		this.dataService.syncFinished = true

		// Resolve the settings synced promise
		this.dataService.settingsSyncPromiseHolder.Resolve(
			this.dataService.settings
		)

		// Reload the books in the library
		this.dataService.LoadAllBooks()
	}
	//#endregion
}
