import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MessageBarType } from 'office-ui-fabric-react';
import { DataService, ApiResponse } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-author-setup-page',
	templateUrl: './author-setup-page.component.html'
})
export class AuthorSetupPageComponent{
	locale = enUS.authorSetupPage;
	createAuthorSubscriptionKey: number;
	firstName: string = "";
	lastName: string = "";
	generalError: string = "";
	firstNameError: string = "";
	lastNameError: string = "";
	messageBarType: MessageBarType = MessageBarType.error;

	constructor(
		public dataService: DataService,
		public websocketService: WebsocketService,
		private router: Router
	){
		this.locale = this.dataService.GetLocale().authorSetupPage;
		this.createAuthorSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.CreateAuthor, (response: ApiResponse) => this.CreateAuthorResponse(response));
	}

	async ngOnInit(){
		// Redirect back to the author page if the user is already an author
		if(await this.dataService.userAuthorPromise){
			this.router.navigate(['/author']);
		}
	}

	ngOnDestroy(){
		this.websocketService.Unsubscribe(this.createAuthorSubscriptionKey);
	}

	async Submit(){
		this.websocketService.Emit(WebsocketCallbackType.CreateAuthor, {
			jwt: this.dataService.user.JWT,
			firstName: this.firstName,
			lastName: this.lastName
		});

		this.firstName = "";
		this.lastName = "";
		this.generalError = "";
		this.firstNameError = "";
		this.lastNameError = "";
	}

	CreateAuthorResponse(response: ApiResponse){
		if(response.status == 201){
			// Set the author in DataService
			this.dataService.userAuthor = {
				uuid: response.data.uuid,
				firstName: response.data.first_name,
				lastName: response.data.last_name,
				bios: [],
				collections: []
			}
			this.dataService.userAuthorPromiseResolve(this.dataService.userAuthor);

			// Redirect to the author page
			this.router.navigate(['/author']);
		}else{
			for(let error of response.data.errors){
				switch (error.code) {
					case 2102:
						// Missing field: first_name
						this.firstNameError = this.locale.errors.firstNameMissing;
						break;
					case 2103:
						// Missing field: last_name
						this.lastNameError = this.locale.errors.lastNameMissing;
						break;
					case 2301:
						// Field too short: first_name
						this.firstNameError = this.locale.errors.firstNameTooShort;
						break;
					case 2302:
						// Field too short: last_name
						this.lastNameError = this.locale.errors.lastNameTooShort;
						break;
					case 2401:
						// Field too long: first_name
						this.firstNameError = this.locale.errors.firstNameTooLong;
						break;
					case 2402:
						// Field too long: last_name
						this.lastNameError = this.locale.errors.lastNameTooLong;
						break;
					default:
						// Unexpected error
						this.generalError = this.locale.errors.unexpectedError;
						break;
				}
			}
		}
	}
}