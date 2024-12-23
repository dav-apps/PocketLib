import {
	Component,
	Input,
	Output,
	EventEmitter,
	ElementRef,
	ViewChild
} from "@angular/core"
import { Dialog } from "dav-ui-components"
import { LocalizationService } from "src/app/services/localization-service"

@Component({
	selector: "pocketlib-create-author-dialog",
	templateUrl: "./create-author-dialog.component.html",
	standalone: false
})
export class CreateAuthorDialogComponent {
	locale = this.localizationService.locale.dialogs.createAuthorDialog
	@ViewChild("dialog") dialog: ElementRef<Dialog>
	@Input() loading: boolean = false
	@Input() firstNameError: string = ""
	@Input() lastNameError: string = ""
	@Output() primaryButtonClick = new EventEmitter()
	visible: boolean = false
	firstName: string = ""
	lastName: string = ""

	constructor(private localizationService: LocalizationService) {}

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

		this.firstName = ""
		this.lastName = ""
	}
}
