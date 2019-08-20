import { Component } from "@angular/core";
import { ActivatedRoute } from '@angular/router';

@Component({
	selector: "pocketlib-app-page",
	templateUrl: "./app-page.component.html"
})
export class AppPageComponent{
   constructor(
      private activatedRoute: ActivatedRoute
   ){
      let uuid = this.activatedRoute.snapshot.paramMap.get('uuid');
   }
}