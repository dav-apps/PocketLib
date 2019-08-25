import { Component, HostListener } from "@angular/core";
import { Router } from '@angular/router';
import { transition, trigger, state, style, animate } from '@angular/animations';
import { DataService } from 'src/app/services/data-service';
import { enUS } from 'src/locales/locales';
import { App, GetAllApps } from 'src/app/models/App';

const navbarHeight: number = 64;

@Component({
	selector: "pocketlib-developer-page",
	templateUrl: "./developer-page.component.html",
	styleUrls: [
		'./developer-page.component.scss'
	],
	animations: [
		trigger('addAppHover', [
			state('false', style({
				transform: 'rotateZ(0deg)',
				fontSize: '18px'
			})),
			state('true', style({
				transform: 'rotateZ(90deg)',
				fontSize: '20px'
			})),
			transition('true => false', [
				animate('0.18s ease-in')
			]),
			transition('false => true', [
				animate('0.18s ease-out')
			])
		])
	]
})
export class DeveloperPageComponent{
   locale = enUS.developerPage;
	header1Height: number = 600;
   header1TextMarginTop: number = 200;
   apps: App[] = [];
	hoveredAppIndex: number = -1;    // The currently hovered book, for showing the shadow
	addAppHover: boolean = false;	// Indicator for if the mouse is over the add app card

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
		if(this.apps.length == 0){
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