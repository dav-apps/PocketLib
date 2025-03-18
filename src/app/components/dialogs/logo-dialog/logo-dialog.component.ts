import {
	Component,
	Output,
	EventEmitter,
	ElementRef,
	ViewChild,
	Inject,
	PLATFORM_ID
} from "@angular/core"
import { isPlatformBrowser } from "@angular/common"
import { ReadFile } from "ngx-file-helpers"
import Cropper from "cropperjs"
import { Dialog } from "dav-ui-components"
import { LocalizationService } from "src/app/services/localization-service"

@Component({
	selector: "pocketlib-logo-dialog",
	templateUrl: "./logo-dialog.component.html",
	styleUrl: "logo-dialog.component.scss",
	standalone: false
})
export class LogoDialogComponent {
	locale = this.localizationService.locale.dialogs.logoDialog
	@ViewChild("dialog") dialog: ElementRef<Dialog>
	@ViewChild("logoDialogImage", { static: true })
	logoDialogImage: ElementRef<HTMLImageElement>
	@Output() primaryButtonClick = new EventEmitter()
	visible: boolean = false
	logoCropper: Cropper

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

	show(file: ReadFile) {
		this.visible = true

		setTimeout(() => {
			this.logoDialogImage.nativeElement.onload = () => {
				this.logoCropper = new Cropper(this.logoDialogImage.nativeElement, {
					aspectRatio: 1,
					autoCropArea: 1,
					viewMode: 2
				})
			}

			this.logoDialogImage.nativeElement.src = file.content
		}, 100)
	}

	hide() {
		this.visible = false
		this.logoCropper.destroy()
	}

	async submit() {
		this.primaryButtonClick.emit({
			canvas: this.logoCropper.getCroppedCanvas()
		})
	}
}
