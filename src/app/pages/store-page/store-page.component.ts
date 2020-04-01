import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { ApiResponse } from 'dav-npm';
import { DataService, FindAppropriateLanguage } from 'src/app/services/data-service';
import { ApiService } from 'src/app/services/api-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-store-page',
	templateUrl: './store-page.component.html'
})
export class StorePageComponent{
	locale = enUS.storePage;
	sideNavHidden: boolean = false;
	
	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private router: Router
	){
		this.locale = this.dataService.GetLocale().storePage;
	}

	async ngOnInit(){
		this.setSize();

		if(this.dataService.categories.length == 0){
			// Get the categories
			let getCategoriesResponse: ApiResponse<any> = await this.apiService.GetCategories();

			// Get the names in the appropriate language
			for(let category of getCategoriesResponse.data.categories){
				let currentLanguageIndex = FindAppropriateLanguage(this.dataService.locale.slice(0, 2), category.names);
				let currentLanguage = category.names[currentLanguageIndex];
				
				this.dataService.categories.push({
					key: category.key,
					name: currentLanguage.name,
					language: currentLanguage.language
				});
			}

			this.dataService.categoriesPromiseResolve();
		}
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

	ShowStartPage(){
		this.router.navigate(["store"]);
		if(this.sideNavHidden) this.dataService.sideNavOpened = false;
	}

	ShowCategory(key: string){
		this.router.navigate(["store", "books", key]);
		if(this.sideNavHidden) this.dataService.sideNavOpened = false;
	}
}