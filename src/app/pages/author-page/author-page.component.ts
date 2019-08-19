import { Component, HostListener } from "@angular/core";
import { DataService } from 'src/app/services/data-service';
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

   constructor(
      public dataService: DataService
   ){
      this.locale = this.dataService.GetLocale().authorPage;
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
}