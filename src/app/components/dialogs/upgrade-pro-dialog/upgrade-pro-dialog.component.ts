import {
	Component,
	Input,
	Output,
	ViewChild,
	ElementRef,
	EventEmitter,
	Inject,
	PLATFORM_ID
} from "@angular/core"
import { isPlatformBrowser } from "@angular/common"
import { Dialog } from "dav-ui-components"
import { LocalizationService } from "src/app/services/localization-service"

@Component({
	selector: "pocketlib-upgrade-pro-dialog",
	templateUrl: "./upgrade-pro-dialog.component.html",
	styleUrl: "./upgrade-pro-dialog.component.scss",
	standalone: false
})
export class UpgradeProDialogComponent {
	locale = this.localizationService.locale.dialogs.upgradeProDialog
	actionsLocale = this.localizationService.locale.actions
	@Input() loading: boolean = false
	@Output() primaryButtonClick = new EventEmitter()
	@ViewChild("dialog") dialog: ElementRef<Dialog>
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
}
