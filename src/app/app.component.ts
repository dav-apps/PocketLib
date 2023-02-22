import { Component, HostListener } from '@angular/core'
import { Router, ActivatedRoute, NavigationStart } from '@angular/router'
import {
	faCircleUser as faCircleUserSolid,
	faGear as faGearSolid,
	faHouse as faHouseSolid,
	faBagShopping as faBagShoppingSolid
} from '@fortawesome/free-solid-svg-icons'
import {
	faCircleUser as faCircleUserRegular,
	faGear as faGearRegular,
	faHouse as faHouseRegular,
	faBagShopping as faBagShoppingRegular
} from '@fortawesome/pro-regular-svg-icons'
import { Dav, TableObject, Environment } from 'dav-js'
import * as DavUIComponents from 'dav-ui-components'
import { DataService } from 'src/app/services/data-service'
import { GetSettings } from 'src/app/models/Settings'
import { GetBookOrder } from './models/BookOrder'
import { smallWindowMaxSize } from 'src/constants/constants'
import { environment } from 'src/environments/environment'

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	faCircleUserRegular = faCircleUserRegular
	faCircleUserSolid = faCircleUserSolid
	faGearRegular = faGearRegular
	faGearSolid = faGearSolid
	faHouseRegular = faHouseRegular
	faHouseSolid = faHouseSolid
	faBagShoppingRegular = faBagShoppingRegular
	faBagShoppingSolid = faBagShoppingSolid
	libraryLabel: string = ""
	storeLabel: string = ""
	libraryTabActive: boolean = false
	storeTabActive: boolean = false
	accountButtonSelected: boolean = false
	settingsButtonSelected: boolean = false

	constructor(
		public dataService: DataService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		let locale = this.dataService.GetLocale().misc
		this.libraryLabel = locale.library
		this.storeLabel = locale.store

		DavUIComponents.setLocale(this.dataService.locale)

		this.router.events.forEach(data => {
			if (data instanceof NavigationStart) {
				// Update the updated todo lists
				this.dataService.currentUrl = data.url

				this.libraryTabActive = this.dataService.currentUrl == "/"
				this.storeTabActive = this.dataService.currentUrl.startsWith("/store")
				this.accountButtonSelected = this.dataService.currentUrl == "/account"
				this.settingsButtonSelected = this.dataService.currentUrl == "/settings"
			}
		})

		// Log the user in if there is an access token in the url
		this.activatedRoute.queryParams.subscribe(async params => {
			if (params["accessToken"]) {
				// Login with the access token
				await this.dataService.dav.Login(params["accessToken"])
				window.location.href = this.router.url.slice(0, this.router.url.indexOf('?'))
			}
		})
	}

	async ngOnInit() {
		this.setSize()
		this.dataService.ApplyTheme()

		new Dav({
			environment: environment.production ? Environment.Production : Environment.Development,
			appId: environment.appId,
			tableIds: [
				environment.settingsTableId,
				environment.bookOrderTableId,
				environment.bookFileTableId,
				environment.bookTableId,
				environment.epubBookmarkTableId
			],
			callbacks: {
				UpdateAllOfTable: (tableId: number, changed: boolean) => this.UpdateAllOfTable(tableId, changed),
				UpdateTableObject: (tableObject: TableObject, fileDownloaded: boolean = false) => this.UpdateTableObject(tableObject, fileDownloaded),
				UserLoaded: () => this.UserLoaded(),
				UserDownloaded: () => this.UserDownloaded(),
				SyncFinished: () => this.SyncFinished()
			}
		})

		// Set the lang attribute of the html element
		let htmlElement = document.getElementsByTagName("html")[0] as HTMLHtmlElement
		if (htmlElement) htmlElement.setAttribute("lang", this.dataService.locale)

		// Get the settings
		this.dataService.settings = await GetSettings()

		// Resolve the settings load promise
		this.dataService.settingsLoadPromiseHolder.Resolve(this.dataService.settings)

		if (await this.dataService.GetOpenLastReadBook() && this.router.url == "/") {
			this.router.navigate(['loading'], { skipLocationChange: true })
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
	}

	@HostListener('window:resize')
	setSize() {
		this.dataService.isMobile = (window.innerWidth <= smallWindowMaxSize)
	}

	navigateToLibraryPage() {
		this.router.navigate(['/'])
	}

	navigateToStorePage() {
		this.router.navigate(['/store'])
	}

	navigateToAccountPage() {
		this.router.navigate(['/account'])
	}

	navigateToSettingsPage() {
		this.router.navigate(['/settings'])
	}

	//#region dav-js callback functions
	async UpdateAllOfTable(tableId: number, changed: boolean) {
		if (tableId == environment.settingsTableId) {
			// Reload the settings if it has changed
			if (changed) {
				this.dataService.settings = await GetSettings()
			}

			// Resolve the settings synced promise
			this.dataService.settingsSyncPromiseHolder.Resolve(this.dataService.settings)
		}
	}

	UpdateTableObject(tableObject: TableObject, fileDownloaded: boolean = false) {
		if (tableObject.TableId == environment.bookTableId) {
			// Reload the book
			this.dataService.ReloadBook(tableObject.Uuid)
		} else if (tableObject.TableId == environment.bookFileTableId && fileDownloaded) {
			// Find the book with that file uuid and reload it
			this.dataService.ReloadBookByFile(tableObject.Uuid)
		}
	}

	UserLoaded() {
		this.dataService.userIsAdmin = environment.admins.includes(this.dataService.dav.user.Id)
		this.dataService.userPromiseHolder.Resolve()
	}

	async UserDownloaded() {
		// Load the author
		await this.dataService.LoadAuthorOfUser()
		this.dataService.userIsAdmin = environment.admins.includes(this.dataService.dav.user.Id)
	}

	SyncFinished() {
		this.dataService.syncFinished = true

		// Resolve the settings synced promise
		this.dataService.settingsSyncPromiseHolder.Resolve(this.dataService.settings)

		// Reload the books in the library
		this.dataService.LoadAllBooks()
	}
	//#endregion
}
