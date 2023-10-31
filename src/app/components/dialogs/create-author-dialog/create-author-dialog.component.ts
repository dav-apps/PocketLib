import {
	Component,
	Input,
	Output,
	EventEmitter,
	ElementRef,
	ViewChild
} from "@angular/core"
import { Dialog } from "dav-ui-components"
import { DataService } from "src/app/services/data-service"
import { enUS } from "src/locales/locales"

@Component({
	selector: "pocketlib-create-author-dialog",
	templateUrl: "./create-author-dialog.component.html"
})
export class CreateAuthorDialogComponent {
	locale = enUS.dialogs.createAuthorDialog
	@ViewChild("dialog") dialog: ElementRef<Dialog>
	@Input() loading: boolean = false
	@Input() firstNameError: string = ""
	@Input() lastNameError: string = ""
	@Output() primaryButtonClick = new EventEmitter()
	visible: boolean = false
	firstName: string = ""
	lastName: string = ""

	constructor(public dataService: DataService) {
		this.locale = this.dataService.GetLocale().dialogs.createAuthorDialog
	}

	ngAfterViewInit() {
		document.body.appendChild(this.dialog.nativeElement)
	}

	ngOnDestroy() {
		document.body.removeChild(this.dialog.nativeElement)
	}

	show() {
		this.visible = true
	}

	hide() {
		this.visible = false
	}

	submit() {
		this.primaryButtonClick.emit({
			firstName: this.firstName,
			lastName: this.lastName
		})
	}
}
