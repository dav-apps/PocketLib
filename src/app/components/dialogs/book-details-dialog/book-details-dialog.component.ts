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
	selector: "pocketlib-book-details-dialog",
	templateUrl: "./book-details-dialog.component.html",
	styleUrl: "./book-details-dialog.component.scss"
})
export class BookDetailsDialogComponent {
	locale = this.localizationService.locale.dialogs.bookDetailsDialog
	actionsLocale = this.localizationService.locale.actions
	@ViewChild("dialog") dialog: ElementRef<Dialog>
	@Input() isbn: string = ""
	@Input() language: string = ""
	@Input() publicationDate: string = ""
	@Input() pageCount: number = 0
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
