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
import { isClient } from "src/app/misc/utils"

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
