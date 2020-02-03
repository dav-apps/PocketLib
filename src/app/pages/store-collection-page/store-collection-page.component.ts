import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
	selector: 'pocketlib-store-collection-page',
	templateUrl: './store-collection-page.component.html'
})
export class StoreCollectionPageComponent{
	uuid: string;

	constructor(
		private activatedRoute: ActivatedRoute
	){
		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid');
	}
}