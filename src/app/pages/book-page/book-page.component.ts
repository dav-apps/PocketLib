import { Component } from "@angular/core";
import { DataService } from 'src/app/services/data-service';
import { Portal, ComponentPortal } from '@angular/cdk/portal';
import { BookContentComponent } from 'src/app/components/book-content/book-content.component';

@Component({
	selector: "pocketlib-book-page",
	templateUrl: "./book-page.component.html"
})
export class BookPageComponent{
   selectedPortal: Portal<any>;

   constructor(
		private dataService: DataService
	){}

   async ngOnInit(){
     this.selectedPortal = new ComponentPortal(BookContentComponent)
	}
}