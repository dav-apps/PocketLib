import { Component, ViewChild, HostListener } from "@angular/core";
import { DataService } from 'src/app/services/data-service';
import * as Dav from 'dav-npm';
import { environment } from 'src/environments/environment';
import { enUS } from 'src/locales/locales';
import { LogoutModalComponent } from '../../components/logout-modal/logout-modal.component';

@Component({
   selector: "pocketlib-account-page",
   templateUrl: "./account-page.component.html"
})
export class AccountPageComponent{
   locale = enUS.accountPage;
	@ViewChild(LogoutModalComponent, { static: false }) logoutModalComponent: LogoutModalComponent;
	width: number = window.innerWidth;
	textMaxWidth: number = 240;
	textFontSize: number = 21;

   constructor(
      public dataService: DataService
   ){
      this.locale = this.dataService.GetLocale().accountPage;
	}
	
	ngOnInit(){
		this.setSize();
	}

   @HostListener('window:resize')
   onResize(){
      this.setSize();
	}
	
	setSize(){
		this.width = window.innerWidth;
		this.textMaxWidth = this.width > 767 ? 240 : null;
		this.textFontSize = this.width > 550 ? 21 : 19;
	}

   ShowLoginPage(){
      Dav.ShowLoginPage(environment.apiKey, environment.baseUrl);
   }

   ShowSignupPage(){
      Dav.ShowSignupPage(environment.apiKey, environment.baseUrl);
   }

   ShowLogoutModal(){
      this.logoutModalComponent.Show();
	}
	
	ShowPlansAccountPage(){
		window.open("https://dav-apps.tech/login?redirect=user%23plans%0A", 'blank');
	}

   Logout(){
      this.dataService.user.Logout().then(() => {
         window.location.href = "/account";
      });
	}

   bytesToGigabytes(bytes: number, rounding: number) : string{
		if(bytes == 0) return "0";
		return Math.round(bytes / 1000000000).toFixed(rounding);
	}

	getUsedStoragePercentage() : number{
		return (this.dataService.user.UsedStorage / this.dataService.user.TotalStorage) * 100;
	}
}