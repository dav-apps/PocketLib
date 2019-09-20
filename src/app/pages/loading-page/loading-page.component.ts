import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data-service';
import { GetBook } from 'src/app/models/BookManager';

@Component({
	selector: 'pocketlib-loading-page',
	templateUrl: './loading-page.component.html'
})
export class LoadingPageComponent{

	constructor(
		private dataService: DataService,
		private router: Router
	){
		this.dataService.navbarVisible = false;
	}

	ngOnInit(){
		// Check if the settings were loaded
		if(this.dataService.settings){
			this.LoadCurrentBook();
		}else{
			// Wait for the settings callback
			this.dataService.settingsLoadCallbacks.push(() => {
				this.LoadCurrentBook();
			})
		}
	}

	async LoadCurrentBook(){
		// Load the current book
		this.dataService.currentBook = await GetBook(this.dataService.settings.currentBook);

		if(this.dataService.currentBook){
			// Go to the book page to show the current book
			this.router.navigate(['book']);
		}else{
			// Go to the Library page as the book does not exist
			this.router.navigate(['/']);
		}
	}
}