import { Component, HostListener } from "@angular/core"
import { ActivatedRoute } from "@angular/router"
import {
	faBagShopping as faBagShoppingLight,
	faRotate as faRotateLight,
	faLock as faLockLight,
	faLockKeyhole as faLockKeyholeLight
} from "@fortawesome/pro-light-svg-icons"
import { Dav } from "dav-js"
import { DataService } from "src/app/services/data-service"
import { environment } from "src/environments/environment"
import { enUS } from "src/locales/locales"
import { GetDualScreenSettings } from "src/app/misc/utils"

@Component({
	selector: "pocketlib-account-page",
	templateUrl: "./account-page.component.html",
	styleUrls: ["./account-page.component.scss"]
})
export class AccountPageComponent {
	faBagShoppingLight = faBagShoppingLight
	faRotateLight = faRotateLight
	faLockLight = faLockLight
	faLockKeyholeLight = faLockKeyholeLight
	locale = enUS.accountPage
	width: number = window.innerWidth
	textMaxWidth: number = 240
	textFontSize: number = 21
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	logoutDialogVisible: boolean = false
	redirect: string

	constructor(
		public dataService: DataService,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().accountPage

		// Check if this is a dual-screen device with a vertical fold
		let dualScreenSettings = GetDualScreenSettings()
		this.dualScreenLayout = dualScreenSettings.dualScreenLayout
		this.dualScreenFoldMargin = dualScreenSettings.dualScreenFoldMargin

		// Get the redirect url param
		this.redirect = this.activatedRoute.snapshot.queryParamMap.get("redirect")
	}

	ngOnInit() {
		this.setSize()
	}

	@HostListener("window:resize")
	onResize() {
		this.setSize()
	}

	setSize() {
		this.width = window.innerWidth
		this.textMaxWidth = this.width > 767 ? 240 : null
		this.textFontSize = this.width > 550 ? 21 : 19
	}

	ShowLoginPage() {
		if (
			this.redirect != null &&
			(this.redirect == "author/setup" ||
				this.redirect.startsWith("store/book/"))
		) {
			Dav.ShowLoginPage(
				environment.apiKey,
				`${window.location.origin}/${this.redirect}`
			)
		} else {
			Dav.ShowLoginPage(environment.apiKey, window.location.origin)
		}
	}

	ShowSignupPage() {
		if (
			this.redirect != null &&
			(this.redirect == "author/setup" ||
				this.redirect.startsWith("store/book/"))
		) {
			Dav.ShowSignupPage(
				environment.apiKey,
				`${window.location.origin}/${this.redirect}`
			)
		} else {
			Dav.ShowSignupPage(environment.apiKey, window.location.origin)
		}
	}

	Logout() {
		this.logoutDialogVisible = false
		this.dataService.dav
			.Logout()
			.then(() => (window.location.href = "/account"))
	}
}
