import { Component, HostListener } from '@angular/core'
import { Router, NavigationStart } from '@angular/router'
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons'
import { faAddressCard as faAddressCardSolid } from '@fortawesome/free-solid-svg-icons'
import { faAddressCard as faAddressCardLight } from '@fortawesome/pro-light-svg-icons'
import { Dav, TableObject, Environment } from 'dav-js'
import { DataService } from 'src/app/services/data-service'
import { RoutingService } from './services/routing-service'
import { GetSettings } from 'src/app/models/Settings'
import { toolbarHeight, smallWindowMaxSize } from 'src/constants/constants'
import { environment } from 'src/environments/environment'

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: [
		'./app.component.scss'
	]
})
export class AppComponent {
	faAddressCardSolid = faAddressCardSolid
	faAddressCardLight = faAddressCardLight
	currentUrl: string = "/"
	bottomToolbarStoreEntryActive: boolean = false
	bottomToolbarAuthorEntryActive: boolean = false

	constructor(
		public dataService: DataService,
		public routingService: RoutingService,
		private router: Router
	) {
		this.router.events.forEach(data => {
			if (data instanceof NavigationStart) {
				// Update the updated todo lists
				this.currentUrl = data.url
				this.bottomToolbarStoreEntryActive = this.currentUrl.startsWith("/store")
				this.bottomToolbarAuthorEntryActive = this.currentUrl.startsWith("/author")
			}
		})
	}

	async ngOnInit() {
		this.setSize()
		this.dataService.ApplyTheme()
		initializeIcons()

		new Dav({
			environment: environment.production ? Environment.Production : Environment.Development,
			appId: environment.appId,
			tableIds: [environment.settingsTableId, environment.bookFileTableId, environment.bookTableId, environment.epubBookmarkTableId],
			callbacks: {
				UpdateAllOfTable: (tableId: number, changed: boolean) => this.UpdateAllOfTable(tableId, changed),
				UpdateTableObject: (tableObject: TableObject, fileDownloaded: boolean = false) => this.UpdateTableObject(tableObject, fileDownloaded),
				UserLoaded: () => this.UserLoaded(),
				SyncFinished: () => this.SyncFinished()
			}
		})

		// Get the settings
		this.dataService.settings = await GetSettings()

		// Resolve the settings load promise
		this.dataService.settingsLoadPromiseHolder.Resolve(this.dataService.settings)

		if (await this.dataService.GetOpenLastReadBook() && this.router.url == "/") {
			this.router.navigate(['loading'], { skipLocationChange: true })
		}

		// Load the books
		this.dataService.LoadAllBooks()

		// Load the author
		await this.dataService.LoadAuthorOfUser()

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

	SyncFinished() {
		this.dataService.syncFinished = true

		// Resolve the settings synced promise
		this.dataService.settingsSyncPromiseHolder.Resolve(this.dataService.settings)

		this.dataService.LoadAllBooks()
	}
	//#endregion

	ShowLibraryPage() {
		this.routingService.NavigateToLibraryPage()
		return false
	}

	ShowAuthorPage() {
		this.routingService.NavigateToAuthorPage()
	}

	ShowStorePage() {
		this.routingService.NavigateToStorePage()
	}

	ShowAccountPage() {
		this.routingService.NavigateToAccountPage()
	}

	ShowSettingsPage() {
		this.routingService.NavigateToSettingsPage()
	}
}
