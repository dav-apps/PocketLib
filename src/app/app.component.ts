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
import { RoutingService } from "src/app/services/routing-service"
import { EpubBook } from "./models/EpubBook"
import { GetBookOrder } from "./models/BookOrder"
import { GetSettings } from "src/app/models/Settings"
import { dataIdFromObject } from "./misc/utils"
import { smallWindowMaxSize } from "src/constants/constants"
import { environment } from "src/environments/environment"
import { enUS } from "src/locales/locales"

@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"]
})
export class AppComponent {
	locale = enUS.misc
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
	@ViewChild("search")
	search: ElementRef<DavUIComponents.Search>
	libraryTabActive: boolean = false
	storeTabActive: boolean = false
	authorButtonSelected: boolean = false
	accountButtonSelected: boolean = false
	settingsButtonSelected: boolean = false
	searchVisible: boolean = false
	searchQuery: string = ""
	searchResultItems: EpubBook[] = []

	constructor(
		public dataService: DataService,
		private routingService: RoutingService,
		private router: Router,
		private activatedRoute: ActivatedRoute,
		private apollo: Apollo,
		private httpLink: HttpLink,
		private cd: ChangeDetectorRef
	) {
		this.locale = this.dataService.GetLocale().misc

		DavUIComponents.setLocale(this.dataService.locale)

		this.router.events.forEach(data => {
			if (data instanceof NavigationStart) {
				// Update the updated todo lists
				this.dataService.currentUrl = data.url.split("?")[0]

				this.libraryTabActive = this.dataService.currentUrl == "/"
				this.storeTabActive =
					this.dataService.currentUrl.startsWith("/store")
				this.authorButtonSelected =
					this.dataService.currentUrl == "/author" ||
					this.dataService.currentUrl == "/publisher"
				this.accountButtonSelected =
					this.dataService.currentUrl == "/account"
				this.settingsButtonSelected =
					this.dataService.currentUrl == "/settings"
			}
		})

		// Log the user in if there is an access token in the url
		this.activatedRoute.queryParams.subscribe(async params => {
			if (params["accessToken"]) {
				// Login with the access token
				await this.dataService.dav.Login(params["accessToken"])
				window.location.href = this.router.url.slice(
					0,
					this.router.url.indexOf("?")
				)
			}
		})
	}

	async ngOnInit() {
		this.setSize()
		this.dataService.ApplyTheme()

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
		if (htmlElement) htmlElement.setAttribute("lang", this.dataService.locale)

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

		if ((await this.dataService.GetOpenLastReadBook()) && url == "/") {
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

	navigateToLibraryPage() {
		this.router.navigate(["/"])
	}

	navigateToStorePage() {
		this.router.navigate(["/store"])
	}

	navigateToAuthorPage() {
		this.router.navigate(["/author"])
	}

	navigateToAccountPage() {
		this.router.navigate(["/account"])
	}

	navigateToSettingsPage() {
		this.router.navigate(["/settings"])
	}

	navigateToBook(book: EpubBook) {
		// Check if the user can access the book
		if (book.storeBook && !this.dataService.dav.isLoggedIn) {
			// TODO: Show dialog
			return
		}

		// Open the book on the book page
		this.searchVisible = false
		this.dataService.currentBook = book
		this.router.navigate(["book"])

		setTimeout(() => {
			this.search.nativeElement.clearSearchQuery()
		}, 500)
	}

	searchChange(event: CustomEvent) {
		this.searchQuery = event.detail.value.toLowerCase()
		this.searchResultItems = []

		if (this.searchQuery.length > 0) {
			for (let book of this.dataService.books) {
				if (!(book instanceof EpubBook)) continue

				if (
					book.title.toLowerCase().includes(this.searchQuery) ||
					book.author.toLowerCase().includes(this.searchQuery)
				) {
					this.searchResultItems.push(book)
				}
			}
		}
	}

	searchButtonClick() {
		this.searchVisible = true
	}

	setupApollo(accessToken: string) {
		this.apollo.removeClient()

		this.apollo.create({
			cache: new InMemoryCache({ dataIdFromObject }),
			link: this.httpLink.create({
				uri: environment.pocketlibApiUrl,
				headers: new HttpHeaders().set("Authorization", accessToken)
			})
		})
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
