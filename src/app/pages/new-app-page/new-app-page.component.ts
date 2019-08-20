import { Component } from "@angular/core";
import { Router } from '@angular/router';
import { App } from 'src/app/models/App';

@Component({
	selector: "pocketlib-new-app-page",
	templateUrl: "./new-app-page.component.html"
})
export class NewAppPageComponent{
	name: string = "";
   url: string = "";
   
   constructor(
      public router: Router
   ){}

	nameChange(name: string){
		this.name = name;
	}

	urlChange(url: string){
		this.url = url;
	}

	async createButtonClick(){
      await App.Create(this.name, this.url);
      this.router.navigate(["developer"]);
	}
}