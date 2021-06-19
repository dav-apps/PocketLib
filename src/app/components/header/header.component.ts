import { Component, Input, Output, EventEmitter } from '@angular/core'

@Component({
	selector: 'pocketlib-header',
	templateUrl: './header.component.html'
})
export class HeaderComponent {
	@Input() title: string = ""
	@Input() editButtonVisible: boolean = false
	@Input() backButtonLink: string = ""
	@Output() backButtonClick = new EventEmitter()
	@Output() editButtonClick = new EventEmitter()
}