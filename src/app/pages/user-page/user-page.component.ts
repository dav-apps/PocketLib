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
import { ApiService } from "src/app/services/api-service"
import { DavApiService } from "src/app/services/dav-api-service"
import { BytesToGigabytesText } from "src/app/misc/utils"
import { environment } from "src/environments/environment"
import { enUS } from "src/locales/locales"

@Component({
	templateUrl: "./user-page.component.html",
	styleUrls: ["./user-page.component.scss"]
})
export class UserPageComponent {
	faBagShoppingLight = faBagShoppingLight
	faRotateLight = faRotateLight
	faLockLight = faLockLight
	faLockKeyholeLight = faLockKeyholeLight
	locale = enUS.userPage
	@ViewChild("logoutDialog")
	logoutDialog: LogoutDialogComponent
	websiteUrl = environment.websiteBaseUrl
	width: number = window.innerWidth
	redirect: string
	usedStoragePercent: number = 0
	usedStorageText: string = ""
	orders: {
		uuid: string
		title: string
		coverSrc: string
		status: string
	}[] = []

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private davApiService: DavApiService,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().userPage

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

		await this.loadOrders()
	}

	@HostListener("window:resize")
	setSize() {
		this.width = window.innerWidth
	}

	async loadOrders() {
		if (!this.dataService.dav.isLoggedIn) return

		// Load the orders of the user
		let listOrdersResponse = await this.davApiService.listOrders(
			`
				items {
					uuid
					tableObject {
						uuid
					}
					status
				}
			`,
			{
				status: ["PREPARATION", "SHIPPED"]
			}
		)

		let orders = listOrdersResponse.data?.listOrders?.items ?? []

		for (let order of orders) {
			let retrieveStoreBookResponse =
				await this.apiService.retrieveStoreBook(
					`
						title
						cover {
							url
						}
					`,
					{ uuid: order.tableObject.uuid }
				)

			const storeBook = retrieveStoreBookResponse.data?.retrieveStoreBook

			if (storeBook != null) {
				this.orders.push({
					uuid: order.uuid,
					title: storeBook.title,
					coverSrc: storeBook.cover.url,
					status:
						order.status == "PREPARATION"
							? this.locale.preparationStatus
							: this.locale.shippedStatus
				})

				continue
			}

			let retrieveVlbItemResponse = await this.apiService.retrieveVlbItem(
				`
					title
					coverUrl
				`,
				{ uuid: order.tableObject.uuid }
			)

			let retrieveVlbItemResponseData =
				retrieveVlbItemResponse.data?.retrieveVlbItem

			if (retrieveVlbItemResponseData != null) {
				this.orders.push({
					uuid: order.uuid,
					title: retrieveVlbItemResponseData.title,
					coverSrc: retrieveVlbItemResponseData.coverUrl,
					status:
						order.status == "PREPARATION"
							? this.locale.preparationStatus
							: this.locale.shippedStatus
				})
			}
		}
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
		this.dataService.dav.Logout().then(() => (window.location.href = "/user"))
	}
}
