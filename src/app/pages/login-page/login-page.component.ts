import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
import { IButtonStyles, MessageBarType } from 'office-ui-fabric-react';
import { enUS } from 'src/locales/locales';

@Component({
	selector: "pocketlib-login-page",
	templateUrl: "./login-page.component.html"
})
export class LoginPageComponent{
	locale = enUS.loginPage;
	loginSubscriptionKey: number;
	getAppSubscriptionKey: number;
	email: string = "";
   password: string = "";
   errorMessage: string = "";
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
		private websocketService: WebsocketService,
		private router: Router,
      private activatedRoute: ActivatedRoute
   ){
		this.dataService.navbarVisible = false;
		this.locale = this.dataService.GetLocale().loginPage;
      
		// Get the app uuid from the params
		this.appUuid = this.activatedRoute.snapshot.queryParamMap.get('app_uuid');
		if(!this.appUuid){
			this.router.navigate(["/"]);
			return;
		}

		this.loginSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.Login, (response: any) => this.LoginResponse(response));
		this.getAppSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.GetApp, (response: any) => this.GetAppResponse(response));

		this.websocketService.Emit(WebsocketCallbackType.GetApp, {uuid: this.appUuid});
	}

	ngOnDestroy(){
		this.websocketService.Unsubscribe(
			this.loginSubscriptionKey,
			this.getAppSubscriptionKey
		)
	}

	LoginResponse(response: any){
		if(!response.status) return;

         if(response.status == 200){
				// Remove errors
				this.errorMessage = "";

				// Redirect the user back to the app
				let jwt = response.jwt;
				window.location.href = `${this.redirectUrl}?jwt=${jwt}`;
         }else{
				// Show the error message
				this.errorMessage = this.getErrorMessage(response.errors[0][0]);

				// Clear the password field
				this.password = "";
         }
	}

	GetAppResponse(response: any){
		if(!response.status) return;
			
		if(response.status == 200){
			// Set the redirect url
			this.redirectUrl = response.url;
		}else{
			// There was an error. Navigate to the root path
			this.router.navigate(["/"]);
		}
	}

	getErrorMessage(code: number){
		if(code == 1201 || code == 2801){
			return this.locale.loginNormalError;
		}else{
			return this.locale.loginUnusualError.replace("{0}", code.toString());
		}
	}

	loginButtonClick(){
		if(this.email.length < 2 || this.password.length < 2) return;

		this.websocketService.Emit(WebsocketCallbackType.Login, {
			email: this.email,
			password: this.password
		});
	}
}