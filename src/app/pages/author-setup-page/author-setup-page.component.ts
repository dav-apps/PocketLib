import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'
import { ApiErrorResponse, ApiResponse, isSuccessStatusCode } from 'dav-js'
import { DataService } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { CachingService } from 'src/app/services/caching-service'
import { GetDualScreenSettings } from 'src/app/misc/utils'
import { environment } from 'src/environments/environment'
import * as ErrorCodes from 'src/constants/errorCodes'
import { enUS } from 'src/locales/locales'
import { AuthorField, AuthorResource } from 'src/app/misc/types'
import { Author } from 'src/app/models/Author'

@Component({
	selector: 'pocketlib-author-setup-page',
	templateUrl: './author-setup-page.component.html'
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
		private cachingService: CachingService,
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
				.replace('{0}', environment.websiteBaseUrl)
				.replace('{1}', this.dataService.darkTheme ? `style="color: #74aaff"` : "")
		)
	}

	async Submit() {
		this.generalError = ""
		this.firstNameError = ""
		this.lastNameError = ""
		this.loading = true

		let response = await this.apiService.CreateAuthor({
			firstName: this.firstName,
			lastName: this.lastName,
			fields: [
				AuthorField.uuid,
				AuthorField.firstName,
				AuthorField.lastName
			]
		})

		if (isSuccessStatusCode(response.status)) {
			let responseData = (response as ApiResponse<AuthorResource>).data

			// Set the author in DataService
			this.dataService.userAuthor = new Author(
				responseData,
				await this.dataService.GetStoreLanguages(),
				this.apiService,
				this.cachingService
			)
			this.dataService.userAuthorPromiseHolder.Resolve(this.dataService.userAuthor)

			// Redirect to the author page
			this.router.navigate(['/author'])
		} else {
			this.loading = false

			for (let error of (response as ApiErrorResponse).errors) {
				switch (error.code) {
					case ErrorCodes.FirstNameMissing:
						this.firstNameError = this.locale.errors.firstNameMissing
						break
					case ErrorCodes.LastNameMissing:
						this.lastNameError = this.locale.errors.lastNameMissing
						break
					case ErrorCodes.FirstNameTooShort:
						if (this.firstName.length == 0) {
							this.firstNameError = this.locale.errors.firstNameMissing
						} else {
							this.firstNameError = this.locale.errors.firstNameTooShort
						}
						break
					case ErrorCodes.LastNameTooShort:
						if (this.lastName.length == 0) {
							this.lastNameError = this.locale.errors.lastNameMissing
						} else {
							this.lastNameError = this.locale.errors.lastNameTooShort
						}
						break
					case ErrorCodes.FirstNameTooLong:
						this.firstNameError = this.locale.errors.firstNameTooLong
						break
					case ErrorCodes.LastNameTooLong:
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