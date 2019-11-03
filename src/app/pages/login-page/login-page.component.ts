import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IButtonStyles, MessageBarType, SpinnerSize } from 'office-ui-fabric-react';
import { Log } from 'dav-npm';
import { DataService, SetTextFieldAutocomplete } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
import { environment } from 'src/environments/environment';
import { enUS } from 'src/locales/locales';

const loginEventName = "login";

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
	loginLoading: boolean = false;
	spinnerSize: SpinnerSize = SpinnerSize.small;
	messageBarType: MessageBarType = MessageBarType.error;
	loginButtonStyles: IButtonStyles = {
		root: {
			marginTop: 24
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

	ngAfterViewInit(){
		// Set the autocomplete attribute of the input elements
		setTimeout(() => {
			SetTextFieldAutocomplete('email-text-field', 'email', true);
			SetTextFieldAutocomplete('password-text-field', 'current-password');
		}, 1);
	}

	ngOnDestroy(){
		this.websocketService.Unsubscribe(
			this.loginSubscriptionKey,
			this.getAppSubscriptionKey
		)
	}

	Login(){
		this.errorMessage = "";
		this.loginLoading = true;

		this.websocketService.Emit(WebsocketCallbackType.Login, {
			email: this.email,
			password: this.password
		});
	}

	async LoginResponse(response: any){
		if(!response.status) return;

		if(response.status == 200){
			// Log the event
			await Log(environment.apiKey, loginEventName);

			// Redirect the user to the redirect url
			let jwt = response.jwt;
			window.location.href = `${this.redirectUrl}?jwt=${jwt}`;
		}else{
			// Show the error message
			this.errorMessage = this.GetLoginErrorMessage(response.errors[0][0]);

			// Clear the password field
			this.password = "";

			// Hide the spinner
			this.loginLoading = false;
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

	GetLoginErrorMessage(code: number){
		if(code == 1201 || code == 2801){
			return this.locale.errors.loginFailed;
		}else{
			return this.locale.errors.unexpectedErrorLong.replace("{0}", code.toString());
		}
	}
}