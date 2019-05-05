import { Component } from "@angular/core";
import { DataService } from 'src/app/services/data-service';
import * as Dav from 'dav-npm';
import { environment } from 'src/environments/environment';

@Component({
   selector: "pocketlib-account-page",
   templateUrl: "./account-page.component.html"
})
export class AccountPageComponent{
   
   constructor(
      private dataService: DataService
   ){}

   ShowLoginPage(){
      Dav.ShowLoginPage(environment.apiKey, environment.baseUrl);
   }

   ShowSignupPage(){
      Dav.ShowSignupPage(environment.baseUrl);
   }
}