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
import { StoreBookItem } from "src/app/misc/types"
import { isClient } from "src/app/misc/utils"

@Component({
	selector: "pocketlib-add-book-dialog",
	templateUrl: "./add-book-dialog.component.html",
	standalone: false
})
export class AddBookDialogComponent {
	locale = this.localizationService.locale.dialogs.addBookDialog
	@ViewChild("dialog") dialog: ElementRef<Dialog>
	@Input() loading: boolean = false
	@Input() books: StoreBookItem[] = []
	@Output() addBook = new EventEmitter()
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
	}

	hide() {
		this.visible = false
	}
}
