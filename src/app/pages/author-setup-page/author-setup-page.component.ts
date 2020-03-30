import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MessageBarType } from 'office-ui-fabric-react';
import { ApiResponse } from 'dav-npm';
import { DataService } from 'src/app/services/data-service';
import { ApiService } from 'src/app/services/api-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-author-setup-page',
	templateUrl: './author-setup-page.component.html'
})
export class AuthorSetupPageComponent{
	locale = enUS.authorSetupPage;
	firstName: string = "";
	lastName: string = "";
	generalError: string = "";
	firstNameError: string = "";
	lastNameError: string = "";
	messageBarType: MessageBarType = MessageBarType.error;

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private router: Router
	){
		this.locale = this.dataService.GetLocale().authorSetupPage;
	}

	async ngOnInit(){
		// Redirect back to the author page if the user is already an author
		if(await this.dataService.userAuthorPromise){
			this.router.navigate(['/author']);
		}
	}

	async Submit(){
		this.generalError = "";
		this.firstNameError = "";
		this.lastNameError = "";

		let response: ApiResponse<any> = await this.apiService.CreateAuthor(
			this.dataService.user.JWT,
			this.firstName,
			this.lastName
		)

		if(response.status == 201){
			// Set the author in DataService
			this.dataService.userAuthor = {
				uuid: response.data.uuid,
				firstName: response.data.first_name,
				lastName: response.data.last_name,
				bios: [],
				collections: [],
				profileImage: false
			}
			this.dataService.userAuthorPromiseResolve(this.dataService.userAuthor);

			// Redirect to the author page
			this.router.navigate(['/author']);
		}else{
			for(let error of response.data.errors){
				switch (error.code) {
					case 2102:	// Missing field: first_name
						this.firstNameError = this.locale.errors.firstNameMissing;
						break;
					case 2103:	// Missing field: last_name
						this.lastNameError = this.locale.errors.lastNameMissing;
						break;
					case 2301:	// Field too short: first_name
						this.firstNameError = this.locale.errors.firstNameTooShort;
						break;
					case 2302:	// Field too short: last_name
						this.lastNameError = this.locale.errors.lastNameTooShort;
						break;
					case 2401:	// Field too long: first_name
						this.firstNameError = this.locale.errors.firstNameTooLong;
						break;
					case 2402:	// Field too long: last_name
						this.lastNameError = this.locale.errors.lastNameTooLong;
						break;
					default:		// Unexpected error
						this.generalError = this.locale.errors.unexpectedError;
						break;
				}
			}
		}
	}
}