import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { DataService } from 'src/app/services/data-service'

@Component({
	selector: 'pocketlib-store-author-page',
	templateUrl: './store-author-page.component.html'
})
export class StoreAuthorPageComponent {
	uuid: string

	constructor(
		public dataService: DataService,
		private activatedRoute: ActivatedRoute
	) {
		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid')
	}
}