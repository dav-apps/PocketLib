import { Component } from "@angular/core";
import { DataService } from 'src/app/services/data-service';

@Component({
   selector: "pocketlib-account-page",
   templateUrl: "./account-page.component.html"
})
export class AccountPageComponent{
   
   constructor(
      private dataService: DataService
   ){}

   ShowLoginPage(){

   }

   ShowSignupPage(){

   }
}