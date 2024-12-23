import {
	Component,
	Output,
	EventEmitter,
	ElementRef,
	ViewChild
} from "@angular/core"
import { Dialog } from "dav-ui-components"
import { LocalizationService } from "src/app/services/localization-service"

@Component({
	selector: "pocketlib-leave-page-dialog",
	templateUrl: "./leave-page-dialog.component.html",
	standalone: false
})
export class LeavePageDialogComponent {
	locale = this.localizationService.locale.dialogs.leavePageDialog
	@ViewChild("dialog") dialog: ElementRef<Dialog>
	@Output() defaultButtonClick = new EventEmitter()
	@Output() primaryButtonClick = new EventEmitter()
	visible: boolean = false

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
}
