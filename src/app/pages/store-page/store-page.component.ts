import { Component, ViewChild, HostListener } from '@angular/core';
import { DataService } from 'src/app/services/data-service';
import { MatDrawer } from '@angular/material/sidenav';

@Component({
	selector: 'pocketlib-store-page',
	templateUrl: './store-page.component.html'
})
export class StorePageComponent{

	@ViewChild('sideNav', {static: true}) sideNav: MatDrawer;
	sideNavHidden: boolean = false;
	
	constructor(
		public dataService: DataService
	){

	}

	@HostListener('window:resize')
	onResize(){
		this.setSize();
	}

	setSize(){
		this.sideNavHidden = window.outerWidth < 576;

		if(!this.sideNavHidden) this.dataService.sideNavOpened = true;
		else this.dataService.sideNavOpened = false;
	}
}