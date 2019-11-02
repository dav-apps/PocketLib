import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data-service';
import { GetBook } from 'src/app/models/BookManager';
import { EpubBook } from 'src/app/models/EpubBook';
import { PdfBook } from 'src/app/models/PdfBook';

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
		
		await this.LoadSettings();
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
	
	async LoadSettings(){
		// Wait for the settings to be loaded
		await this.dataService.settingsLoadPromise;

		// Wait for the settings to be synced if the user is logged in
		if(this.dataService.user.IsLoggedIn){
			await new Promise(resolve => {
				let resolved: boolean = false;
	
				// Wait for the settings to be synced
				this.dataService.settingsSyncPromise.then(() => {
					if(!resolved){
						resolved = true;
						resolve();
					}
				});
	
				// Wait for max 5 seconds
				setTimeout(() => {
					if(!resolved){
						resolved = true;
						resolve();
					}
				}, 5000);
			});
		}

		// Show the book
		this.LoadCurrentBook();
	}

	async LoadCurrentBook(){
		// Load the current book
		this.dataService.currentBook = await GetBook(this.dataService.settings.book);

		// Load the progress of the current book
		if(this.dataService.currentBook instanceof EpubBook){
			this.dataService.currentBook.chapter = this.dataService.settings.chapter;
			this.dataService.currentBook.progress = this.dataService.settings.progress;
		}else if(this.dataService.currentBook instanceof PdfBook){
			this.dataService.currentBook.page = this.dataService.settings.progress;
		}

		if(this.dataService.currentBook){
			// Go to the book page to show the current book
			this.router.navigate(['book']);
		}else{
			// Go to the Library page as the book does not exist
			this.router.navigate(['/']);
		}
	}
}