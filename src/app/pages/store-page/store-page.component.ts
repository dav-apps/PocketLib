import { Component, HostListener } from '@angular/core';
import { DataService, ApiResponse, FindAppropriateLanguage } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-store-page',
	templateUrl: './store-page.component.html'
})
export class StorePageComponent{
	locale = enUS.storePage;
	sideNavHidden: boolean = false;
	categories: {key: string, name: string, language: string}[] = [];
	
	constructor(
		public dataService: DataService,
		private websocketService: WebsocketService
	){
		this.locale = this.dataService.GetLocale().storePage;
	}

	async ngOnInit(){
		this.setSize();

		// Get the categories
		await this.dataService.userPromise;
		let getCategoriesResponse: ApiResponse = await this.websocketService.Emit(WebsocketCallbackType.GetCategories, {jwt: this.dataService.user.JWT});

		// Get the names in the appropriate language
		for(let category of getCategoriesResponse.data.categories){
			let currentLanguageIndex = FindAppropriateLanguage(this.dataService.locale.slice(0, 2), category.names);
			let currentLanguage = category.names[currentLanguageIndex];
			
			this.categories.push({
				key: category.key,
				name: currentLanguage.name,
				language: currentLanguage.language
			});
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

	ShowCategory(key: string){
		
	}
}