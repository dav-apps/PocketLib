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
	logoutDialogVisible: boolean = false
	redirect: string

	constructor(
		public dataService: DataService,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().accountPage

		// Get the redirect url param
		this.redirect = this.activatedRoute.snapshot.queryParamMap.get("redirect")
	}

	ngOnInit() {
		this.setSize()
	}

	@HostListener("window:resize")
	setSize() {
		this.width = window.innerWidth
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
