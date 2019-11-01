import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data-service';
import { GetBook } from 'src/app/models/BookManager';

@Component({
	selector: 'pocketlib-loading-page',
   templateUrl: './loading-page.component.html'
})
export class LoadingPageComponent{
   height: number = 500;

	constructor(
		private dataService: DataService,
		private router: Router
	){
      this.dataService.navbarVisible = false;
	}

	async ngOnInit(){
		this.setSize();

		// Wait for the user to be loaded
		await this.dataService.userPromise;
		
		this.LoadSettings();
   }

   ngAfterViewInit(){
      // Set the color of the progress ring
      let progress = document.getElementsByTagName('circle');
      if(progress.length > 0){
         let item = progress.item(0);
         item.setAttribute('style', item.getAttribute('style') + ' stroke: white');
      }
   }
   
   @HostListener('window:resize')
	onResize(){
		this.setSize();
   }
   
   setSize(){
      this.height = window.innerHeight;
	}
	
	LoadSettings(){
		// Check if the settings were loaded
		if(this.dataService.settings && !this.dataService.user.IsLoggedIn){
			this.LoadCurrentBook();
      }else if(this.dataService.user.IsLoggedIn && !this.dataService.syncFinished){
         // Wait for the settings sync callback
         this.dataService.settingsSyncedCallbacks.push(() => this.LoadCurrentBook());
		}else if(!this.dataService.user.IsLoggedIn){
         // Wait for the settings callback
			this.dataService.settingsLoadCallbacks.push(() => this.LoadCurrentBook());
      }else{
			this.LoadCurrentBook();
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