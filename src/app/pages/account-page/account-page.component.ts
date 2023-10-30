import { Component, HostListener, ViewChild } from "@angular/core"
import { ActivatedRoute } from "@angular/router"
import {
	faBagShopping as faBagShoppingLight,
	faRotate as faRotateLight,
	faLock as faLockLight,
	faLockKeyhole as faLockKeyholeLight
} from "@fortawesome/pro-light-svg-icons"
import { Dav } from "dav-js"
import { LogoutDialogComponent } from "src/app/components/dialogs/logout-dialog/logout-dialog.component"
import { DataService } from "src/app/services/data-service"
import { BytesToGigabytesText } from "src/app/misc/utils"
import { environment } from "src/environments/environment"
import { enUS } from "src/locales/locales"

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
	@ViewChild("logoutDialog")
	logoutDialog: LogoutDialogComponent
	websiteUrl = environment.websiteBaseUrl
	width: number = window.innerWidth
	redirect: string
	usedStoragePercent: number = 0
	usedStorageText: string = ""

	constructor(
		public dataService: DataService,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().accountPage

		// Get the redirect url param
		this.redirect = this.activatedRoute.snapshot.queryParamMap.get("redirect")
	}

	async ngOnInit() {
		this.setSize()

		await this.dataService.userPromiseHolder.AwaitResult()

		this.usedStoragePercent =
			(this.dataService.dav.user.UsedStorage /
				this.dataService.dav.user.TotalStorage) *
			100

		this.usedStorageText = this.locale.storageUsed
			.replace(
				"{0}",
				BytesToGigabytesText(this.dataService.dav.user.UsedStorage, 1)
			)
			.replace(
				"{1}",
				BytesToGigabytesText(this.dataService.dav.user.TotalStorage, 0)
			)
	}

	@HostListener("window:resize")
	setSize() {
		this.width = window.innerWidth
	}

	ShowLoginPage() {
		if (this.redirect != null && this.redirect.startsWith("store/book/")) {
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
		this.logoutDialog.hide()

		this.dataService.dav
			.Logout()
			.then(() => (window.location.href = "/account"))
	}
}
