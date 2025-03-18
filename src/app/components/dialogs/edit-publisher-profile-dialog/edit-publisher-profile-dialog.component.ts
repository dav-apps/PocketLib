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
	selector: "pocketlib-edit-publisher-profile-dialog",
	templateUrl: "./edit-publisher-profile-dialog.component.html",
	standalone: false
})
export class EditPublisherProfileDialogComponent {
	locale = this.localizationService.locale.dialogs.editPublisherProfileDialog
	@ViewChild("dialog") dialog: ElementRef<Dialog>
	@Input() name: string = ""
	@Input() websiteUrl: string = ""
	@Input() facebookUsername: string = ""
	@Input() instagramUsername: string = ""
	@Input() twitterUsername: string = ""
	@Input() nameError: string = ""
	@Input() websiteUrlError: string = ""
	@Input() facebookUsernameError: string = ""
	@Input() instagramUsernameError: string = ""
	@Input() twitterUsernameError: string = ""
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
			name: this.name,
			websiteUrl: this.websiteUrl,
			facebookUsername: this.facebookUsername,
			instagramUsername: this.instagramUsername,
			twitterUsername: this.twitterUsername
		})
	}
}
