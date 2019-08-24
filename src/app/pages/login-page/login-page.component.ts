import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/services/data-service';
import { IButtonStyles, MessageBarType, initializeIcons } from 'office-ui-fabric-react';
import { enUS } from 'src/locales/locales';
declare var io: any;

const loginKey = "login";
const getAppKey = "getApp";

@Component({
	selector: "pocketlib-login-page",
	templateUrl: "./login-page.component.html"
})
export class LoginPageComponent{
	locale = enUS.loginPage;
	email: string = "";
   password: string = "";
   errorMessage: string = "";
	socket: any = null;
	appUuid: string = "";
	redirectUrl: string = "";
	messageBarType: MessageBarType = MessageBarType.error;
	buttonStyles: IButtonStyles = {
		rootFocused: {
			outline: "none"
		}
	}

   constructor(
		private dataService: DataService,
		private router: Router,
      private activatedRoute: ActivatedRoute
   ){
		this.dataService.navbarVisible = false;
		this.locale = this.dataService.GetLocale().loginPage;

		// Initialize the icons for the message bar
      initializeIcons();
      
		// Get the app uuid from the params
		this.appUuid = this.activatedRoute.snapshot.queryParamMap.get('app_uuid');
	}

	ngOnInit(){
		this.socket = io();
      
      this.socket.on(loginKey, (message: any) => {
			if(!message.status) return;

         if(message.status == 200){
				// Remove errors
				this.errorMessage = "";

				// Redirect the user back to the app
				let jwt = message.jwt;
				window.location.href = `${this.redirectUrl}?jwt=${jwt}`;
         }else{
				// Show the error message
				this.errorMessage = this.getErrorMessage(message.errors[0][0]);

				// Clear the password field
				this.password = "";
         }
		});

		if(!this.appUuid) this.router.navigate(["/"]);

		this.socket.on(getAppKey, (message: any) => {
			if(!message.status) return;
			
			if(message.status == 200){
				// Set the redirect url
				this.redirectUrl = message.url;
			}else{
				// There was an error. Navigate to the root path
				this.router.navigate(["/"]);
			}
		});
		
		this.socket.emit(getAppKey, {
			uuid: this.appUuid
		});
	}

	getErrorMessage(code: number){
		if(code == 1201 || code == 2801){
			return this.locale.loginNormalError;
		}else{
			return this.locale.loginUnusualError.replace("{0}", code.toString());
		}
	}

	loginButtonClick(){
		if(!this.socket || this.email.length < 2 || this.password.length < 2) return;

		this.socket.emit(loginKey, {
			email: this.email,
			password: this.password
		});
	}
}