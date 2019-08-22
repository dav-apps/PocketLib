import { Component } from '@angular/core';
import { DataService } from 'src/app/services/data-service';
import { IButtonStyles, MessageBarType, initializeIcons } from 'office-ui-fabric-react';
import { enUS } from 'src/locales/locales';
declare var io: any;

const loginKey = "login";

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
	messageBarType: MessageBarType = MessageBarType.error;
	buttonStyles: IButtonStyles = {
		rootFocused: {
			outline: "none"
		}
	}

   constructor(
      private dataService: DataService
   ){
		this.dataService.navbarVisible = false;
		this.locale = this.dataService.GetLocale().loginPage;
      this.socket = io();
      
      this.socket.on(loginKey, (message) => {
			if(!message.status) return;

         if(message.status == 200){
				// Remove errors
				this.errorMessage = "";

				// Redirect the user back to the app

         }else{
				// Show the error message
				this.errorMessage = this.getErrorMessage(message.errors[0][0]);

				// Clear the password field
				this.password = "";
         }
		});

		// Initialize the icons for the message bar
		initializeIcons();
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