import {
	Component,
	Input,
	Output,
	EventEmitter,
	ViewChild
} from "@angular/core"
import { LocalizationService } from "src/app/services/localization-service"
import { CategoriesSelectionComponent } from "src/app/components/categories-selection/categories-selection.component"

@Component({
	selector: "pocketlib-new-book-page-categories-section",
	templateUrl: "./new-book-page-categories-section.component.html",
	styleUrl: "./new-book-page-categories-section.component.scss",
	standalone: false
})
export class NewBookPageCategoriesSectionComponent {
	locale = this.localizationService.locale.newBookPage
	@Input() section: number = 0
	@Input() visibleSection: number = 0
	@Input() forwardNavigation: boolean = false
	@Output() previous = new EventEmitter()
	@Output() submit = new EventEmitter()
	@ViewChild("categoriesSelection", { static: true })
	categoriesSelection: CategoriesSelectionComponent

	constructor(private localizationService: LocalizationService) {}

	Previous() {
		this.previous.emit()
	}

	Submit() {
		this.submit.emit(this.categoriesSelection.GetSelectedCategories())
	}
}
