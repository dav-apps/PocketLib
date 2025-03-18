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
	selector: "pocketlib-publish-changes-dialog",
	templateUrl: "./publish-changes-dialog.component.html",
	standalone: false
})
export class PublishChangesDialogComponent {
	locale = this.localizationService.locale.dialogs.publishChangesDialog
	@ViewChild("dialog") dialog: ElementRef<Dialog>
	@Input() loading: boolean = false
	@Input() releaseNameError: string = ""
	@Input() releaseNotesError: string = ""
	@Output() primaryButtonClick = new EventEmitter()
	visible: boolean = false
	releaseName: string = ""
	releaseNotes: string = ""

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
		this.releaseName = ""
		this.releaseNotes = ""
		this.visible = true
	}

	hide() {
		this.visible = false
	}

	clearErrors() {
		this.releaseNameError = ""
		this.releaseNotesError = ""
	}

	submit() {
		this.primaryButtonClick.emit({
			releaseName: this.releaseName,
			releaseNotes: this.releaseNotes
		})

		this.releaseName = ""
		this.releaseNotes = ""
	}
}
