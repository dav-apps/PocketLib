import {
	Component,
	Input,
	Output,
	EventEmitter,
	ViewChild
} from "@angular/core"
import { DataService } from "src/app/services/data-service"
import { CategoriesSelectionComponent } from "src/app/components/categories-selection/categories-selection.component"
import { enUS } from "src/locales/locales"

@Component({
	selector: "pocketlib-new-book-page-categories-section",
	templateUrl: "./new-book-page-categories-section.component.html"
})
export class NewBookPageCategoriesSectionComponent {
	locale = enUS.newBookPage
	@Input() section: number = 0
	@Input() visibleSection: number = 0
	@Input() forwardNavigation: boolean = false
	@Output() previous = new EventEmitter()
	@Output() submit = new EventEmitter()
	@ViewChild("categoriesSelection", { static: true })
	categoriesSelection: CategoriesSelectionComponent

	constructor(public dataService: DataService) {
		this.locale = this.dataService.GetLocale().newBookPage
	}

	Previous() {
		this.previous.emit()
	}

	Submit() {
		this.submit.emit(this.categoriesSelection.GetSelectedCategories())
	}
}
