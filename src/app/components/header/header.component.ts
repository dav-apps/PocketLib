import { Component, Input, Output, EventEmitter } from '@angular/core'

@Component({
	selector: 'pocketlib-header',
	templateUrl: './header.component.html'
})
export class HeaderComponent {
	@Input() title: string = ""
	@Input() editButtonVisible: boolean = false
	@Output() backButtonClick = new EventEmitter()
	@Output() editButtonClick = new EventEmitter()
}