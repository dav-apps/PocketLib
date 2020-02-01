import { Component, HostListener } from "@angular/core";
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/services/data-service';
import { WebsocketService } from 'src/app/services/websocket-service';
import { enUS } from 'src/locales/locales';

const navbarHeight: number = 64;

@Component({
	selector: "pocketlib-author-page",
   templateUrl: "./author-page.component.html",
   styleUrls: [
      './author-page.component.scss'
   ]
})
export class AuthorPageComponent{
	locale = enUS.authorPage;
   header1Height: number = 600;
	header1TextMarginTop: number = 200;
	uuid: string;

   constructor(
		public dataService: DataService,
		public websocketService: WebsocketService,
		private router: Router,
		private activatedRoute: ActivatedRoute
   ){
		this.locale = this.dataService.GetLocale().authorPage;

		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid');
   }
   
   ngOnInit(){
		this.setSize();
	}

   @HostListener('window:resize')
	onResize(){
		this.setSize();
   }
   
   setSize(){
		this.header1Height = window.innerHeight - navbarHeight;
		this.header1TextMarginTop = this.header1Height * 0.36;
	}

   createProfileButtonClick(){
		if(this.dataService.user.IsLoggedIn){
			// Redirect to the Author setup page
			this.router.navigate(['author', 'setup']);
      }else{
			// Redirect to the Account page
			this.router.navigate(["account"]);
		}
	}

	ShowAuthor(uuid: string){
		this.router.navigate(['author', uuid]);
	}
}