import { Component } from "@angular/core"
import { Router } from "@angular/router"
import { DomSanitizer, SafeHtml } from "@angular/platform-browser"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { GetDualScreenSettings } from "src/app/misc/utils"
import { environment } from "src/environments/environment"
import * as ErrorCodes from "src/constants/errorCodes"
import { enUS } from "src/locales/locales"
import { Author } from "src/app/models/Author"

@Component({
	selector: "pocketlib-author-setup-page",
	templateUrl: "./author-setup-page.component.html"
})
export class AuthorSetupPageComponent {
	locale = enUS.authorSetupPage
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	firstName: string = ""
	lastName: string = ""
	generalError: string = ""
	firstNameError: string = ""
	lastNameError: string = ""
	terms: SafeHtml = ""
	loading: boolean = false

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private router: Router,
		private domSanitizer: DomSanitizer
	) {
		this.locale = this.dataService.GetLocale().authorSetupPage

		// Check if this is a dual-screen device with a vertical fold
		let dualScreenSettings = GetDualScreenSettings()
		this.dualScreenLayout = dualScreenSettings.dualScreenLayout
		this.dualScreenFoldMargin = dualScreenSettings.dualScreenFoldMargin
	}

	async ngOnInit() {
		// Redirect back to the author page if the user is already an author
		if (await this.dataService.userAuthorPromiseHolder.AwaitResult()) {
			this.router.navigate(["author"])
		}

		// Set the terms of service text
		this.terms = this.domSanitizer.bypassSecurityTrustHtml(
			this.locale.terms
				.replace("{0}", environment.websiteBaseUrl)
				.replace(
					"{1}",
					this.dataService.darkTheme ? `style="color: #74aaff"` : ""
				)
		)
	}

	async Submit() {
		this.generalError = ""
		this.firstNameError = ""
		this.lastNameError = ""
		this.loading = true

		let response = await this.apiService.createAuthor(
			`
				uuid
				firstName
				lastName
			`,
			{
				firstName: this.firstName,
				lastName: this.lastName
			}
		)

		if (response.errors == null) {
			let responseData = response.data.createAuthor

			// Set the author in DataService
			this.dataService.userAuthor = new Author(
				responseData,
				await this.dataService.GetStoreLanguages(),
				this.apiService
			)
			this.dataService.userAuthorPromiseHolder.Resolve(
				this.dataService.userAuthor
			)

			// Redirect to the author page
			this.router.navigate(["/author"])
		} else {
			this.loading = false
			let errors = response.errors[0].extensions.errors as string[]

			for (let errorCode of errors) {
				switch (errorCode) {
					case ErrorCodes.firstNameTooShort:
						if (this.firstName.length == 0) {
							this.firstNameError = this.locale.errors.firstNameMissing
						} else {
							this.firstNameError = this.locale.errors.firstNameTooShort
						}
						break
					case ErrorCodes.lastNameTooShort:
						if (this.lastName.length == 0) {
							this.lastNameError = this.locale.errors.lastNameMissing
						} else {
							this.lastNameError = this.locale.errors.lastNameTooShort
						}
						break
					case ErrorCodes.firstNameTooLong:
						this.firstNameError = this.locale.errors.firstNameTooLong
						break
					case ErrorCodes.lastNameTooLong:
						this.lastNameError = this.locale.errors.lastNameTooLong
						break
					default:
						this.generalError = this.locale.errors.unexpectedError
						break
				}
			}
		}
	}
}
