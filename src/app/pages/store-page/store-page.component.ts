import { Component, HostListener, ViewChild } from '@angular/core'
import { Router } from '@angular/router'
import { MatDrawerContainer } from '@angular/material/sidenav'
import { DataService } from 'src/app/services/data-service'
import { GetDualScreenSettings } from 'src/app/misc/utils'
import { smallWindowMaxSize } from 'src/constants/constants'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-store-page',
	templateUrl: './store-page.component.html'
})
export class StorePageComponent {
	@ViewChild('matDrawerContainer') matDrawerContainer: MatDrawerContainer
	locale = enUS.storePage
	sideNavHidden: boolean = false
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	selectLanguagesDialogVisible: boolean = false

	constructor(
		public dataService: DataService,
		private router: Router
	) {
		this.locale = this.dataService.GetLocale().storePage

		// Check if this is a dual-screen device with a vertical fold
		let dualScreenSettings = GetDualScreenSettings()
		this.dualScreenLayout = dualScreenSettings.dualScreenLayout
		this.dualScreenFoldMargin = dualScreenSettings.dualScreenFoldMargin
	}

	ngOnInit() {
		this.setSize()
	}

	ngAfterViewInit() {
		this.dataService.storePageDrawerContainer = this.matDrawerContainer
	}

	@HostListener('window:resize')
	setSize() {
		this.sideNavHidden = window.innerWidth <= smallWindowMaxSize

		if (!this.sideNavHidden) this.dataService.sideNavOpened = true
		else this.dataService.sideNavOpened = false
	}

	ShowStartPage() {
		this.router.navigate(["store"])
		if (this.sideNavHidden) this.dataService.sideNavOpened = false
	}

	ShowCategory(key: string) {
		this.router.navigate(["store", "category", key])
		if (this.sideNavHidden) this.dataService.sideNavOpened = false
	}

	ShowAuthorPage() {
		this.router.navigate(["author"])
		if (this.sideNavHidden) this.dataService.sideNavOpened = false
	}
}