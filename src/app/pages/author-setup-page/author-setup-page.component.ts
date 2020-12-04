import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'
import { MessageBarType, SpinnerSize } from 'office-ui-fabric-react'
import { ApiResponse } from 'dav-npm'
import { DataService, SetTextFieldAutocomplete } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-author-setup-page',
	templateUrl: './author-setup-page.component.html'
})
export class AuthorSetupPageComponent{
	locale = enUS.authorSetupPage
	firstName: string = ""
	lastName: string = ""
	generalError: string = ""
	firstNameError: string = ""
	lastNameError: string = ""
	terms: SafeHtml = ""
	loading: boolean = false
	messageBarType: MessageBarType = MessageBarType.error
	spinnerSize: SpinnerSize = SpinnerSize.small

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private router: Router,
		private domSanitizer: DomSanitizer
	){
		this.locale = this.dataService.GetLocale().authorSetupPage
	}

	async ngOnInit(){
		// Redirect back to the author page if the user is already an author
		if(await this.dataService.userAuthorPromiseHolder.AwaitResult()){
			this.router.navigate(["author"])
		}

		// Set the terms of service text
		this.terms = this.domSanitizer.bypassSecurityTrustHtml(this.locale.terms.replace('{0}', this.dataService.darkTheme ? `style="color: #74aaff"` : ""))
	}

	ngAfterViewInit() {
		// Set the autocomplete attributes for the input elements
		setTimeout(() => {
			SetTextFieldAutocomplete('first-name-textfield', 'given-name', true)
			SetTextFieldAutocomplete('last-name-textfield', 'family-name', true)
		}, 1)
	}

	async Submit(){
		this.generalError = ""
		this.firstNameError = ""
		this.lastNameError = ""
		this.loading = true

		let response: ApiResponse<any> = await this.apiService.CreateAuthor({
			jwt: this.dataService.user.JWT,
			firstName: this.firstName,
			lastName: this.lastName
		})

		if(response.status == 201){
			// Set the author in DataService
			this.dataService.userAuthor = {
				uuid: response.data.uuid,
				firstName: response.data.first_name,
				lastName: response.data.last_name,
				websiteUrl: response.data.website_url,
				facebookUsername: response.data.facebook_username,
				instagramUsername: response.data.instagram_username,
				twitterUsername: response.data.twitter_username,
				bios: [],
				collections: [],
				profileImage: false,
				profileImageBlurhash: null
			}
			this.dataService.userAuthorPromiseHolder.Resolve(this.dataService.userAuthor)

			// Redirect to the author page
			this.router.navigate(['/author'])
		} else {
			this.loading = false

			for(let error of response.data.errors){
				switch (error.code) {
					case 2102:	// Missing field: first_name
						this.firstNameError = this.locale.errors.firstNameMissing
						break
					case 2103:	// Missing field: last_name
						this.lastNameError = this.locale.errors.lastNameMissing
						break
					case 2301:	// Field too short: first_name
						if (this.firstName.length == 0) {
							this.firstNameError = this.locale.errors.firstNameMissing
						} else {
							this.firstNameError = this.locale.errors.firstNameTooShort
						}
						break
					case 2302:	// Field too short: last_name
						if (this.lastName.length == 0) {
							this.lastNameError = this.locale.errors.lastNameMissing
						} else {
							this.lastNameError = this.locale.errors.lastNameTooShort
						}
						break
					case 2401:	// Field too long: first_name
						this.firstNameError = this.locale.errors.firstNameTooLong
						break
					case 2402:	// Field too long: last_name
						this.lastNameError = this.locale.errors.lastNameTooLong
						break
					default:		// Unexpected error
						this.generalError = this.locale.errors.unexpectedError
						break
				}
			}
		}
	}
}