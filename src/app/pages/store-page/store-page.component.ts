import { Component, HostListener, ViewChild, ElementRef } from '@angular/core'
import { Router } from '@angular/router'
import { DataService } from 'src/app/services/data-service'
import { GetDualScreenSettings } from 'src/app/misc/utils'
import { smallWindowMaxSize } from 'src/constants/constants'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-store-page',
	templateUrl: './store-page.component.html'
})
export class StorePageComponent {
	@ViewChild('container') storePageContentContainer: ElementRef<HTMLDivElement>
	locale = enUS.storePage
	width: number = 500
	height: number = 500
	sideNavHidden: boolean = false
	categoriesVisible: boolean = true
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
		this.dataService.storePageContentContainer = this.storePageContentContainer
	}

	@HostListener('window:resize')
	setSize() {
		this.width = window.innerWidth
		this.height = window.innerHeight
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
}