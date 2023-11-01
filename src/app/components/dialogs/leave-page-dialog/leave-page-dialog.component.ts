import {
	Component,
	Output,
	EventEmitter,
	ElementRef,
	ViewChild
} from "@angular/core"
import { Dialog } from "dav-ui-components"
import { DataService } from "src/app/services/data-service"
import { enUS } from "src/locales/locales"

@Component({
	selector: "pocketlib-leave-page-dialog",
	templateUrl: "./leave-page-dialog.component.html"
})
export class LeavePageDialogComponent {
	locale = enUS.dialogs.leavePageDialog
	@ViewChild("dialog") dialog: ElementRef<Dialog>
	@Output() defaultButtonClick = new EventEmitter()
	@Output() primaryButtonClick = new EventEmitter()
	visible: boolean = false

	constructor(public dataService: DataService) {
		this.locale = this.dataService.GetLocale().dialogs.leavePageDialog
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
}
