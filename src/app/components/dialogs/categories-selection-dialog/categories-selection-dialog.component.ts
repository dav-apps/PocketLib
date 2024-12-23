import {
	Component,
	Input,
	Output,
	EventEmitter,
	ElementRef,
	ViewChild
} from "@angular/core"
import { Dialog } from "dav-ui-components"
import { CategoriesSelectionComponent } from "src/app/components/categories-selection/categories-selection.component"
import { LocalizationService } from "src/app/services/localization-service"
import { isClient } from "src/app/misc/utils"

@Component({
	selector: "pocketlib-categories-selection-dialog",
	templateUrl: "./categories-selection-dialog.component.html",
	standalone: false
})
export class CategoriesSelectionDialogComponent {
	locale = this.localizationService.locale.dialogs.categoriesSelectionDialog
	@ViewChild("dialog") dialog: ElementRef<Dialog>
	@ViewChild("categoriesSelection")
	categoriesSelection: CategoriesSelectionComponent
	@Input() loading: boolean = false
	@Input() categoryKeys: string[] = []
	@Output() primaryButtonClick = new EventEmitter()
	visible: boolean = false

	constructor(private localizationService: LocalizationService) {}

	ngAfterViewInit() {
		if (isClient()) {
			document.body.appendChild(this.dialog.nativeElement)
		}
	}

	ngOnDestroy() {
		if (isClient()) {
			document.body.removeChild(this.dialog.nativeElement)
		}
	}

	show() {
		this.visible = true

		setTimeout(() => {
			this.categoriesSelection.SetSelectedCategories(this.categoryKeys)
		}, 0)
	}

	hide() {
		this.visible = false
	}

	submit() {
		this.primaryButtonClick.emit({
			categoryKeys: this.categoriesSelection.GetSelectedCategories()
		})
	}
}
