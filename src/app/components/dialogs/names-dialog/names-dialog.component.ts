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
	selector: "pocketlib-names-dialog",
	templateUrl: "./names-dialog.component.html",
	standalone: false
})
export class NamesDialogComponent {
	locale = this.localizationService.locale.dialogs.namesDialog
	@ViewChild("dialog") dialog: ElementRef<Dialog>
	@Input() uuid: string = ""
	@Input() names: { name: string; language: string }[]
	@Output() update = new EventEmitter()
	visible: boolean = false

	constructor(public localizationService: LocalizationService) {}

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
