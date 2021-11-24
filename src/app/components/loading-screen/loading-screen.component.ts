import { Component, Input, HostListener } from '@angular/core'
import { GetDualScreenSettings } from 'src/app/misc/utils'

@Component({
	selector: 'pocketlib-loading-screen',
	templateUrl: './loading-screen.component.html',
	styleUrls: ['./loading-screen.component.scss']
})
export class LoadingScreenComponent {
	@Input() message: string = ""
	height: number = 500
	dualScreenLayout: boolean = false

	ngOnInit() {
		this.setSize()

		// Check if this is a dual-screen device with a vertical fold
		this.dualScreenLayout = GetDualScreenSettings().dualScreenLayout
	}

	ngAfterViewInit() {
		// Set the color of the progress ring
		let progress = document.getElementsByTagName('circle')

		if (progress.length > 0) {
			let item = progress.item(0)
			item.setAttribute('style', item.getAttribute('style') + ' stroke: white')
		}
	}

	@HostListener('window:resize')
	setSize() {
		this.height = window.innerHeight
	}
}