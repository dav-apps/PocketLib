import { Component, Input, Output, EventEmitter } from '@angular/core'

@Component({
	selector: 'pocketlib-link-icon-button',
	templateUrl: './link-icon-button.component.html'
})
export class LinkIconButtonComponent{
	@Input() icon
	@Output() click = new EventEmitter()

	Click() {
		this.click.emit()
	}
}