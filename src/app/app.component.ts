import { Component, HostListener } from '@angular/core'
import { Router } from '@angular/router'
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons'
import { Dav, TableObject, Environment } from 'dav-npm'
import { DataService } from 'src/app/services/data-service'
import { RoutingService } from './services/routing-service'
import { GetSettings } from 'src/app/models/Settings'
import { environment } from 'src/environments/environment'

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	constructor(
		public dataService: DataService,
		public routingService: RoutingService,
		private router: Router
	) { }

	async ngOnInit() {
		this.dataService.ApplyTheme()
		initializeIcons()

		new Dav({
			environment: environment.production ? Environment.Production : Environment.Development,
			appId: environment.appId,
			tableIds: [environment.settingsTableId, environment.bookFileTableId, environment.bookTableId, environment.epubBookmarkTableId, environment.appTableId],
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
		this.dataService.userPromiseHolder.Resolve(this.dataService.dav.user)
	}

	SyncFinished() {
		this.dataService.syncFinished = true

		// Resolve the settings synced promise
		this.dataService.settingsSyncPromiseHolder.Resolve(this.dataService.settings)

		this.dataService.LoadAllBooks()
	}

	ngAfterViewInit() {
		this.setSize()
	}

	@HostListener('window:resize')
	onResize() {
		this.setSize()
	}

	setSize() {
		let navbarHeight = document.getElementById('navbar').clientHeight
		this.dataService.contentHeight = window.innerHeight - navbarHeight
	}

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
