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
	selector: "pocketlib-profile-image-dialog",
	templateUrl: "./profile-image-dialog.component.html",
	styleUrl: "profile-image-dialog.component.scss",
	standalone: false
})
export class ProfileImageDialogComponent {
	locale = this.localizationService.locale.dialogs.profileImageDialog
	@ViewChild("dialog") dialog: ElementRef<Dialog>
	@ViewChild("profileImageDialogImage", { static: true })
	profileImageDialogImage: ElementRef<HTMLImageElement>
	@Output() primaryButtonClick = new EventEmitter()
	visible: boolean = false
	profileImageCropper: Cropper

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
			this.profileImageDialogImage.nativeElement.onload = () => {
				this.profileImageCropper = new Cropper(
					this.profileImageDialogImage.nativeElement,
					{
						aspectRatio: 1,
						autoCropArea: 1,
						viewMode: 2
					}
				)
			}

			this.profileImageDialogImage.nativeElement.src = file.content
		}, 100)
	}

	hide() {
		this.visible = false
		this.profileImageCropper.destroy()
	}

	async submit() {
		this.primaryButtonClick.emit({
			canvas: this.profileImageCropper.getCroppedCanvas()
		})
	}
}
