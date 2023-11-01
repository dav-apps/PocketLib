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
	selector: "pocketlib-names-dialog",
	templateUrl: "./names-dialog.component.html"
})
export class NamesDialogComponent {
	locale = enUS.dialogs.namesDialog
	@ViewChild("dialog") dialog: ElementRef<Dialog>
	@Input() uuid: string = ""
	@Input() names: { name: string; language: string }[]
	@Output() update = new EventEmitter()
	visible: boolean = false

	constructor(public dataService: DataService) {
		this.locale = this.dataService.GetLocale().dialogs.namesDialog
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
