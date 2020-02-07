import { Component, HostListener } from '@angular/core';
import { DataService } from 'src/app/services/data-service';

@Component({
	selector: 'pocketlib-store-page',
	templateUrl: './store-page.component.html'
})
export class StorePageComponent{
	sideNavHidden: boolean = false;
	
	constructor(
		public dataService: DataService
	){

	}

	ngOnInit(){
		this.setSize();
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