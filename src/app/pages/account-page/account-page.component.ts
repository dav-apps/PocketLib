import { Component, ViewChild, HostListener } from "@angular/core";
import { DataService } from 'src/app/services/data-service';
import * as Dav from 'dav-npm';
import { environment } from 'src/environments/environment';
import { LogoutModalComponent } from '../../components/logout-modal/logout-modal.component';

@Component({
   selector: "pocketlib-account-page",
   templateUrl: "./account-page.component.html"
})
export class AccountPageComponent{
	@ViewChild(LogoutModalComponent, { static: false }) logoutModalComponent: LogoutModalComponent;
   width: number = window.innerWidth;

   constructor(
      private dataService: DataService
   ){}

   @HostListener('window:resize')
   onResize(){
      this.width = window.innerWidth;
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