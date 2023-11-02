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
	selector: "pocketlib-edit-profile-dialog",
	templateUrl: "./edit-profile-dialog.component.html"
})
export class EditProfileDialogComponent {
	locale = enUS.dialogs.editProfileDialog
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

	constructor(public dataService: DataService) {
		this.locale = this.dataService.GetLocale().dialogs.editProfileDialog
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
			name: this.name,
			websiteUrl: this.websiteUrl,
			facebookUsername: this.facebookUsername,
			instagramUsername: this.instagramUsername,
			twitterUsername: this.twitterUsername
		})
	}
}
