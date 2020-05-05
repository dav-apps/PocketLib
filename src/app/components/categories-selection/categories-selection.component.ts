import { Component, Output, EventEmitter } from '@angular/core';
import { DataService } from 'src/app/services/data-service';

@Component({
	selector: 'pocketlib-categories-selection',
	templateUrl: './categories-selection.component.html'
})
export class CategoriesSelectionComponent{
	@Output() change = new EventEmitter();
	selectedCategories: string[] = [];

	constructor(
		public dataService: DataService
	) { }

	async ngOnInit() {
		await this.dataService.categoriesPromiseHolder.AwaitResult();

		setTimeout(() => {
			// Set the text color of the checkbox labels
			let checkboxes = document.getElementsByClassName('ms-Checkbox-text');

			for (let i = 0; i < checkboxes.length; i++){
				checkboxes.item(i).setAttribute("style", "color: var(--text-color)");
			}
		}, 1)
	}
	
	public SetSelectedCategories(categories: string[]) {
		this.selectedCategories = categories;
	}

	public GetSelectedCategories() : string[]{
		return this.selectedCategories;
	}

	CategoryCheckboxSelected(event: {checked: boolean}, key: string) {
		if (event.checked) {
			// Add the category to the selected categories
			this.selectedCategories.push(key);
		} else {
			// Remove the category from the selected categories
			let i = this.selectedCategories.indexOf(key);
			if (i != -1) this.selectedCategories.splice(i, 1);
		}

		this.change.emit();
	}
}