import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MessageBarType } from 'office-ui-fabric-react';
import { DataService } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-author-setup-page',
	templateUrl: './author-setup-page.component.html'
})
export class AuthorSetupPageComponent{
	locale = enUS.authorSetupPage;
	setAuthorOfUserSubscriptionKey: number;
	firstName: string = "";
	lastName: string = "";
	bio: string = "";
	generalError: string = "";
	firstNameError: string = "";
	lastNameError: string = "";
	bioError: string = "";
	messageBarType: MessageBarType = MessageBarType.error;

	constructor(
		public dataService: DataService,
		public websocketService: WebsocketService,
		private router: Router
	){
		this.locale = this.dataService.GetLocale().authorSetupPage;
		this.setAuthorOfUserSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.SetAuthorOfUser, (response: {status: number, data: any}) => this.SetAuthorOfUserResponse(response));
	}

	async ngOnInit(){
		// Redirect back to the author page if the user is already an author
		if(await this.dataService.userAuthorPromise){
			this.router.navigate(['/author']);
		}
	}

	ngOnDestroy(){
		this.websocketService.Unsubscribe(this.setAuthorOfUserSubscriptionKey);
	}

	async Submit(){
		this.websocketService.Emit(WebsocketCallbackType.SetAuthorOfUser, {
			jwt: this.dataService.user.JWT,
			firstName: this.firstName,
			lastName: this.lastName,
			bio: this.bio
		});

		this.firstName = "";
		this.lastName = "";
		this.bio = "";
		this.firstNameError = "";
		this.lastNameError = "";
		this.bioError = "";
		this.generalError = "";
	}

	SetAuthorOfUserResponse(response: {status: number, data: any}){
		if(response.status == 200){
			// Set the author in DataService
			this.dataService.userAuthor = {
				firstName: response.data.first_name,
				lastName: response.data.last_name,
				bio: response.data.bio,
				books: []
			}
			this.dataService.userAuthorPromiseResolve(this.dataService.userAuthor);

			// Redirect to the author page
			this.router.navigate(['/author']);
		}else{
			for(let error of response.data.errors){
				switch (error.code) {
					case 2103:
						// Missing field: first_name
						this.firstNameError = this.locale.errors.firstNameMissing;
						break;
					case 2104:
						// Missing field: last_name
						this.lastNameError = this.locale.errors.lastNameMissing;
						break;
					case 2105:
						// Missing field: bio
						this.bioError = this.locale.errors.bioMissing;
						break;
					case 2301:
						// Field too short: first_name
						this.firstNameError = this.locale.errors.firstNameTooShort;
						break;
					case 2302:
						// Field too short: last_name
						this.lastNameError = this.locale.errors.lastNameTooShort;
						break;
					case 2303:
						// Field too short: bio
						this.bioError = this.locale.errors.bioTooShort;
						break;
					case 2401:
						// Field too long: first_name
						this.firstNameError = this.locale.errors.firstNameTooLong;
						break;
					case 2402:
						// Field too long: last_name
						this.lastNameError = this.locale.errors.lastNameTooLong;
						break;
					case 2403:
						// Field too long: bio
						this.bioError = this.locale.errors.bioTooLong;
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