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
import { DataService } from "src/app/services/data-service"
import { enUS } from "src/locales/locales"

@Component({
	selector: "pocketlib-categories-selection-dialog",
	templateUrl: "./categories-selection-dialog.component.html"
})
export class CategoriesSelectionDialogComponent {
	locale = enUS.dialogs.categoriesSelectionDialog
	@ViewChild("dialog") dialog: ElementRef<Dialog>
	@ViewChild("categoriesSelection")
	categoriesSelection: CategoriesSelectionComponent
	@Input() loading: boolean = false
	@Input() categoryKeys: string[] = []
	@Output() primaryButtonClick = new EventEmitter()
	visible: boolean = false

	constructor(public dataService: DataService) {
		this.locale =
			this.dataService.GetLocale().dialogs.categoriesSelectionDialog
	}

	ngAfterViewInit() {
		document.body.appendChild(this.dialog.nativeElement)
	}

	ngOnDestroy() {
		document.body.removeChild(this.dialog.nativeElement)
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
