import { Component, HostListener } from '@angular/core'
import { Router, NavigationStart } from '@angular/router'
import {
	faAddressCard as faAddressCardSolid,
	faGear as faGearSolid,
	faCircleUser as faCircleUserSolid
} from '@fortawesome/free-solid-svg-icons'
import {
	faGear as faGearRegular,
	faCircleUser as faCircleUserRegular
} from '@fortawesome/pro-regular-svg-icons'
import { faAddressCard as faAddressCardLight } from '@fortawesome/pro-light-svg-icons'
import { Dav, TableObject, Environment } from 'dav-js'
import * as DavUIComponents from 'dav-ui-components'
import { DataService } from 'src/app/services/data-service'
import { RoutingService } from './services/routing-service'
import { GetSettings } from 'src/app/models/Settings'
import { GetBookOrder } from './models/BookOrder'
import { toolbarHeight, smallWindowMaxSize } from 'src/constants/constants'
import { environment } from 'src/environments/environment'

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	faAddressCardSolid = faAddressCardSolid
	faAddressCardLight = faAddressCardLight
	faGearRegular = faGearRegular
	faGearSolid = faGearSolid
	faCircleUserRegular = faCircleUserRegular
	faCircleUserSolid = faCircleUserSolid
	bottomToolbarStoreEntryActive: boolean = false
	bottomToolbarAuthorEntryActive: boolean = false
	libraryTabActive: boolean = false
	storeTabActive: boolean = false
	accountButtonSelected: boolean = false
	settingsButtonSelected: boolean = false

	constructor(
		public dataService: DataService,
		public routingService: RoutingService,
		private router: Router
	) {
		DavUIComponents.setLocale(this.dataService.locale)

		this.router.events.forEach(data => {
			if (data instanceof NavigationStart) {
				// Update the updated todo lists
				this.dataService.currentUrl = data.url
				this.bottomToolbarStoreEntryActive = this.dataService.currentUrl.startsWith("/store")
				this.bottomToolbarAuthorEntryActive = this.dataService.currentUrl.startsWith("/author")

				this.libraryTabActive = this.dataService.currentUrl == "/"
				this.storeTabActive = this.dataService.currentUrl.startsWith("/store")
				this.accountButtonSelected = this.dataService.currentUrl == "/account"
				this.settingsButtonSelected = this.dataService.currentUrl == "/settings"
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
		this.dataService.smallWindow = (window.innerWidth <= smallWindowMaxSize)

		let navbarHeight = document.getElementById('navbar').clientHeight
		this.dataService.contentHeight = window.innerHeight - navbarHeight - (this.dataService.smallWindow ? toolbarHeight : 0)
		this.dataService.UpdateBottomToolbarVisibility()
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
