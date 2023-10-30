import { Component, ElementRef, ViewChild } from "@angular/core"
import { Dialog } from "dav-ui-components"
import { DataService } from "src/app/services/data-service"
import { enUS } from "src/locales/locales"

@Component({
	selector: "pocketlib-add-book-error-dialog",
	templateUrl: "./add-book-error-dialog.component.html"
})
export class AddBookErrorDialogComponent {
	locale = enUS.dialogs.addBookErrorDialog
	@ViewChild("dialog") dialog: ElementRef<Dialog>
	visible: boolean = false

	constructor(public dataService: DataService) {
		this.locale = this.dataService.GetLocale().dialogs.addBookErrorDialog
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
