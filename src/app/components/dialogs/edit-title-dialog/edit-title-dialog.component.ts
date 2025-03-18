import {
	Component,
	Input,
	Output,
	EventEmitter,
	ElementRef,
	ViewChild,
	Inject,
	PLATFORM_ID
} from "@angular/core"
import { isPlatformBrowser } from "@angular/common"
import { Dialog } from "dav-ui-components"
import { LocalizationService } from "src/app/services/localization-service"

@Component({
	selector: "pocketlib-edit-title-dialog",
	templateUrl: "./edit-title-dialog.component.html",
	standalone: false
})
export class EditTitleDialogComponent {
	locale = this.localizationService.locale.dialogs.editTitleDialog
	@ViewChild("dialog") dialog: ElementRef<Dialog>
	@Input() loading: boolean = false
	@Input() title: string = ""
	@Input() titleError: string = ""
	@Output() primaryButtonClick = new EventEmitter()
	visible: boolean = false

	constructor(
		private localizationService: LocalizationService,
		@Inject(PLATFORM_ID) private platformId: object
	) {}

	ngAfterViewInit() {
		if (isPlatformBrowser(this.platformId)) {
			document.body.appendChild(this.dialog.nativeElement)
		}
	}

	ngOnDestroy() {
		if (isPlatformBrowser(this.platformId)) {
			document.body.removeChild(this.dialog.nativeElement)
		}
	}

	show() {
		this.visible = true
	}

	hide() {
		this.visible = false
	}

	submit() {
		this.primaryButtonClick.emit({
			title: this.title
		})
	}
}
