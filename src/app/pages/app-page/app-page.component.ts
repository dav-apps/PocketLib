import { Component } from "@angular/core";
import { Router, ActivatedRoute } from '@angular/router';
import { App, GetApp } from 'src/app/models/App';

@Component({
	selector: "pocketlib-app-page",
	templateUrl: "./app-page.component.html"
})
export class AppPageComponent{
   uuid: string;
   app: App = new App();

   constructor(
		private router: Router,
      private activatedRoute: ActivatedRoute
   ){
      this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid');
   }

   async ngOnInit(){
      // Get the app
		this.app = await GetApp(this.uuid);

		if(!this.app){
			this.router.navigate(["developer"]);
		}
   }
}