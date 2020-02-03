import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/services/data-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-author-collection-page',
	templateUrl: './author-collection-page.component.html'
})
export class AuthorCollectionPageComponent{
	locale = enUS.authorCollectionPage;
	uuid: string;

	constructor(
		public dataService: DataService,
		private activatedRoute: ActivatedRoute
	){
		this.locale = this.dataService.GetLocale().authorCollectionPage;

		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid');
	}
}