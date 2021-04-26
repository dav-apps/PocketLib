import { Component, HostListener } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { IDialogContentProps, IButtonStyles } from 'office-ui-fabric-react'
import { Dav } from 'dav-js'
import { DataService } from 'src/app/services/data-service'
import { environment } from 'src/environments/environment'
import { enUS } from 'src/locales/locales'
import { GetDualScreenSettings, UpdateDialogForDualScreenLayout } from 'src/app/misc/utils'

@Component({
	selector: "pocketlib-account-page",
	templateUrl: "./account-page.component.html"
})
export class AccountPageComponent {
	locale = enUS.accountPage
	width: number = window.innerWidth
	textMaxWidth: number = 240
	textFontSize: number = 21
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	logoutDialogVisible: boolean = false
	redirect: string

	logoutDialogContentProps: IDialogContentProps = {
		title: this.locale.logoutDialog.title
	}
	logoutDialogPrimaryButtonStyles: IButtonStyles = {
		root: {
			marginLeft: 10,
			backgroundColor: "#dc3545"
		},
		rootHovered: {
			backgroundColor: "#c82333"
		},
		rootPressed: {
			backgroundColor: "#c82333"
		}
	}

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

	@HostListener('window:resize')
	onResize() {
		this.setSize()
	}

	setSize() {
		this.width = window.innerWidth
		this.textMaxWidth = this.width > 767 ? 240 : null
		this.textFontSize = this.width > 550 ? 21 : 19
	}

	ShowLoginPage() {
		if (this.redirect == "author/setup") {
			Dav.ShowLoginPage(environment.apiKey, `${environment.baseUrl}/author/setup`)
		} else {
			Dav.ShowLoginPage(environment.apiKey, environment.baseUrl)
		}
	}

	ShowSignupPage() {
		if (this.redirect == "author/setup") {
			Dav.ShowSignupPage(environment.apiKey, `${environment.baseUrl}/author/setup`)
		} else {
			Dav.ShowSignupPage(environment.apiKey, environment.baseUrl)
		}
	}

	ShowLogoutDialog() {
		this.logoutDialogContentProps.title = this.locale.logoutDialog.title
		this.logoutDialogVisible = true

		if (this.dualScreenLayout) {
			UpdateDialogForDualScreenLayout()
		}
	}

	Logout() {
		this.logoutDialogVisible = false
		this.dataService.dav.Logout().then(() => window.location.href = "/account")
	}
}