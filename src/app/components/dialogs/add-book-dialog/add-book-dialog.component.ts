import {
	Component,
	Input,
	Output,
	EventEmitter,
	ElementRef,
	ViewChild
} from "@angular/core"
import { Dialog } from "dav-ui-components"
import { StoreBookItem } from "src/app/misc/types"
import { LocalizationService } from "src/app/services/localization-service"

@Component({
	selector: "pocketlib-add-book-dialog",
	templateUrl: "./add-book-dialog.component.html"
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
