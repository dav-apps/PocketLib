import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/services/data-service';

@Component({
	selector: 'pocketlib-author-book-page',
	templateUrl: './author-book-page.component.html'
})
export class AuthorBookPageComponent{
	uuid: string;
	
	constructor(
		private dataService: DataService,
		private router: Router,
      private activatedRoute: ActivatedRoute
	){
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid');
	}
}