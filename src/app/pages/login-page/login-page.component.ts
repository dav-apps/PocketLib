import { Component } from '@angular/core';
import { DataService } from 'src/app/services/data-service';
import { IButtonStyles } from 'office-ui-fabric-react';
import { enUS } from 'src/locales/locales';

@Component({
	selector: "pocketlib-login-page",
	templateUrl: "./login-page.component.html"
})
export class LoginPageComponent{
	locale = enUS.loginPage;
	email: string = "";
	password: string = "";
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
   }

	loginButtonClick(){
		
	}
}