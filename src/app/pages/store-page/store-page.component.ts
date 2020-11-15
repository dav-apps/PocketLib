import { Component, HostListener } from '@angular/core'
import { Router } from '@angular/router'
import { IDialogContentProps } from 'office-ui-fabric-react'
import { DataService } from 'src/app/services/data-service'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-store-page',
	templateUrl: './store-page.component.html'
})
export class StorePageComponent{
	locale = enUS.storePage
	sideNavHidden: boolean = false
	selectLanguagesDialogVisible: boolean = false

	selectLanguagesDialogContentProps: IDialogContentProps = {
		title: this.locale.selectLanguagesDialog.title
	}
	
	constructor(
		public dataService: DataService,
		private router: Router
	){
		this.locale = this.dataService.GetLocale().storePage
	}

	async ngOnInit(){
		this.setSize()
	}

	@HostListener('window:resize')
	onResize(){
		this.setSize()
	}

	setSize(){
		this.sideNavHidden = window.outerWidth < 576

		if(!this.sideNavHidden) this.dataService.sideNavOpened = true
		else this.dataService.sideNavOpened = false
	}

	ShowStartPage(){
		this.router.navigate(["store"])
		if(this.sideNavHidden) this.dataService.sideNavOpened = false
	}

	ShowCategory(key: string){
		this.router.navigate(["store", "books", key])
		if(this.sideNavHidden) this.dataService.sideNavOpened = false
	}

	async ShowLanguagesDialog() {
		this.selectLanguagesDialogContentProps.title = this.locale.selectLanguagesDialog.title
		this.selectLanguagesDialogVisible = true
	}
}