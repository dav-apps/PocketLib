import {
	Component,
	Output,
	EventEmitter,
	ElementRef,
	ViewChild
} from "@angular/core"
import { ReadFile } from "ngx-file-helpers"
import Cropper from "cropperjs"
import { Dialog } from "dav-ui-components"
import { DataService } from "src/app/services/data-service"
import { enUS } from "src/locales/locales"

@Component({
	selector: "pocketlib-logo-dialog",
	templateUrl: "./logo-dialog.component.html",
	styleUrls: ["logo-dialog.component.scss"]
})
export class LogoDialogComponent {
	locale = enUS.dialogs.logoDialog
	@ViewChild("dialog") dialog: ElementRef<Dialog>
	@ViewChild("logoDialogImage", { static: true })
	logoDialogImage: ElementRef<HTMLImageElement>
	@Output() primaryButtonClick = new EventEmitter()
	visible: boolean = false
	logoCropper: Cropper

	constructor(public dataService: DataService) {
		this.locale = this.dataService.GetLocale().dialogs.logoDialog
	}

	ngAfterViewInit() {
		document.body.appendChild(this.dialog.nativeElement)
	}

	ngOnDestroy() {
		document.body.removeChild(this.dialog.nativeElement)
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
		let canvas = this.logoCropper.getCroppedCanvas()
		this.primaryButtonClick.emit({ canvas })
	}
}
