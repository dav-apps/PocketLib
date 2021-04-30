import { Component, ViewChild, ElementRef, HostListener } from '@angular/core'
import { DataService } from 'src/app/services/data-service'
import { GetElementHeight } from 'src/app/misc/utils'

@Component({
	selector: 'pocketlib-store-start-page',
	templateUrl: './store-start-page.component.html'
})
export class StoreStartPageComponent {
	@ViewChild('container', { static: true }) container: ElementRef<HTMLDivElement>

	constructor(
		public dataService: DataService
	) { }

	ngAfterViewInit() {
		this.setSize()
	}

	@HostListener('window:resize')
	setSize() {
		if (this.container) this.dataService.storePageContentHeight = GetElementHeight(this.container.nativeElement)
	}
}