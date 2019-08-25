import { Component } from "@angular/core";
import { Router } from '@angular/router';
import { App } from 'src/app/models/App';
import { IIconStyles, IButtonStyles } from 'office-ui-fabric-react';
import { enUS } from 'src/locales/locales';
import { DataService } from 'src/app/services/data-service';

@Component({
	selector: "pocketlib-new-app-page",
	templateUrl: "./new-app-page.component.html"
})
export class NewAppPageComponent{
   locale = enUS.newAppPage;
	name: string = "";
   url: string = "";
   backButtonIconStyles: IIconStyles = {
		root: {
         fontSize: 18
		}
   }
   buttonStyles: IButtonStyles = {
		rootFocused: {
			outline: "none"
		}
	}
   
   constructor(
      private dataService: DataService,
      public router: Router
   ){
      this.locale = this.dataService.GetLocale().newAppPage;
   }

	async Create(){
      await App.Create(this.name, this.url);
      this.router.navigate(["developer"]);
   }
   
   GoBack(){
		this.router.navigate(['/developer']);
	}
}