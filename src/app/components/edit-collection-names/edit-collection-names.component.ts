import { Component, Input } from '@angular/core';

@Component({
	selector: 'pocketlib-edit-collection-names',
	templateUrl: './edit-collection-names.component.html'
})
export class EditCollectionNamesComponent{
	@Input() collectionNames: {name: string, language: string, fullLanguage: string, edit: boolean}[] = []
}