import { Component, HostListener } from "@angular/core";
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data-service';
import { enUS } from 'src/locales/locales';
import { App, GetAllApps } from 'src/app/models/App';

const navbarHeight: number = 64;

@Component({
	selector: "pocketlib-developer-page",
	templateUrl: "./developer-page.component.html",
	styleUrls: [
		'./developer-page.component.scss'
	]
})
export class DeveloperPageComponent{
   locale = enUS.developerPage;
	header1Height: number = 600;
   header1TextMarginTop: number = 200;
   apps: App[] = [];

	constructor(
		public dataService: DataService,
		public router: Router
   ){
		this.locale = this.dataService.GetLocale().developerPage;
   }

	async ngOnInit(){
		this.apps = await GetAllApps();
		this.setSize();
	}

   @HostListener('window:resize')
	onResize(){
		this.setSize();
   }
   
   setSize(){
		if(this.apps.length > 0){
			this.header1Height = window.innerHeight - navbarHeight;
			this.header1TextMarginTop = this.header1Height * 0.36;
		}
   }

   createAppButtonClick(){
      if(!this.dataService.user.IsLoggedIn){
			this.router.navigate(["/account"]);
      }else{
         this.router.navigate(["/developer/apps/new"]);
      }
   }

   appSelected(app: App){
      // Navigate to the App Page
      this.router.navigate(["developer/apps", app.uuid]);
   }

   createApp(){
      // Navigate to the New App Page
      this.router.navigate(["developer/apps/new"]);
   }
}