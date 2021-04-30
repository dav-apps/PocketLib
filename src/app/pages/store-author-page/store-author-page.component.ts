import { Component, ViewChild, ElementRef, HostListener } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { DataService } from 'src/app/services/data-service'
import { GetElementHeight } from 'src/app/misc/utils'

@Component({
	selector: 'pocketlib-store-author-page',
	templateUrl: './store-author-page.component.html'
})
export class StoreAuthorPageComponent {
	@ViewChild('container', { static: true }) container: ElementRef<HTMLElement>
	uuid: string

	constructor(
		public dataService: DataService,
		private activatedRoute: ActivatedRoute
	) {
		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid')
	}

	ngAfterViewInit() {
		this.setSize()
	}

	@HostListener('window:resize')
	setSize() {
		if (this.container) this.dataService.storePageContentHeight = GetElementHeight(this.container.nativeElement)
	}

	AuthorProfileLoaded() {
		setTimeout(() => {
			this.setSize()
		})
	}
}