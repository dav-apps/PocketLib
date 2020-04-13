import { Component, Output, EventEmitter } from '@angular/core';
import { transition, trigger, state, style, animate } from '@angular/animations';

@Component({
	selector: 'pocketlib-add-list-item',
	templateUrl: './add-list-item.component.html',
	animations: [
		trigger('hover', [
			state('false', style({
				transform: 'rotateZ(0deg)',
				fontSize: '22px'
			})),
			state('true', style({
				transform: 'rotateZ(90deg)',
				fontSize: '28px'
			})),
			transition('true => false', [
				animate('0.18s ease-in')
			]),
			transition('false => true', [
				animate('0.18s ease-out')
			])
		])
	]
})
export class AddListItemComponent{
	@Output() click = new EventEmitter();
	hover: boolean = false;

	ItemClick() {
		this.click.emit();
	}
}