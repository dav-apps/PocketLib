import { Component, HostListener } from "@angular/core";

const navbarHeight: number = 64;

@Component({
	selector: "pocketlib-developer-page",
	templateUrl: "./developer-page.component.html",
	styleUrls: [
		'./developer-page.component.scss'
	]
})
export class DeveloperPageComponent{
	header1Height: number = 600;
	header1TextMarginTop: number = 200;

	constructor(){}

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