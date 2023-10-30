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
	selector: "pocketlib-create-publisher-dialog",
	templateUrl: "./create-publisher-dialog.component.html"
})
export class CreatePublisherDialogComponent {
	locale = enUS.dialogs.createPublisherDialog
	@ViewChild("dialog") dialog: ElementRef<Dialog>
	@Input() loading: boolean = false
	@Input() nameError: string = ""
	@Output() primaryButtonClick = new EventEmitter()
	visible: boolean = false
	name: string = ""

	constructor(public dataService: DataService) {
		this.locale = this.dataService.GetLocale().dialogs.createPublisherDialog
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
			name: this.name
		})
	}
}
