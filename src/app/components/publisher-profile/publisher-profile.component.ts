import { Component, Input, ElementRef, ViewChild, HostListener } from "@angular/core"
import { ReadFile } from "ngx-file-helpers"
import Cropper from "cropperjs"
import { ApiResponse, ApiErrorResponse, isSuccessStatusCode } from "dav-js"
import { Publisher } from "src/app/models/Publisher"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { CachingService } from "src/app/services/caching-service"
import {
	PublisherMode,
	PublisherResource,
	PublisherField,
	PublisherLogoResource
} from "src/app/misc/types"
import { enUS } from "src/locales/locales"

const maxLogoFileSize = 2000000

@Component({
	selector: "pocketlib-publisher-profile",
	templateUrl: "./publisher-profile.component.html"
})
export class PublisherProfileComponent {
	locale = enUS.publisherProfile
	@Input() uuid: string
	publisherMode: PublisherMode = PublisherMode.Normal
	publisher: Publisher = new Publisher(null, this.apiService, this.cachingService)
	storeContext: boolean = true		// Whether the component is shown in the Store
	logoContent: string = this.dataService.defaultProfileImageUrl
	logoAlt: string = ""
	logoWidth: number = 200
	logoLoading: boolean = false
	errorMessage: string = ""

	//#region LogoDialog
	@ViewChild('logoDialogImage', { static: true }) logoDialogImage: ElementRef<HTMLImageElement>
	logoDialogVisible: boolean = false
	logoCropper: Cropper
	//#endregion

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private cachingService: CachingService
	) {
		this.locale = this.dataService.GetLocale().publisherProfile

		this.storeContext = this.dataService.currentUrl.startsWith("/store")
	}

	async ngOnInit() {
		this.setSize()

		await this.dataService.userPromiseHolder.AwaitResult()
		await this.dataService.userAuthorPromiseHolder.AwaitResult()

		if (this.dataService.userIsAdmin) {
			this.publisherMode = PublisherMode.PublisherOfAdmin

			// Get the publisher from the admin publishers
			this.publisher = this.dataService.adminPublishers.find(publisher => publisher.uuid == this.uuid)
		} else if (this.dataService.userPublisher) {
			this.publisherMode = PublisherMode.PublisherOfUser
			this.publisher = this.dataService.userPublisher
		} else {
			// Get the publisher from the server
			await this.LoadPublisher()
		}

		if (this.publisher == null) return

		if (this.publisher.logo?.url != null) {
			// Load the publisher profile image
			this.apiService.GetFile({ url: this.publisher.logo.url }).then((fileResponse: ApiResponse<string> | ApiErrorResponse) => {
				if (isSuccessStatusCode(fileResponse.status)) {
					this.logoContent = (fileResponse as ApiResponse<string>).data
				}
			})
		}

		this.logoAlt = this.dataService.GetLocale().misc.publisherLogoAlt.replace('{0}', this.publisher.name)
	}

	@HostListener('window:resize')
	setSize() {
		if (window.innerWidth < 768) {
			this.logoWidth = 110
		} else if (window.innerWidth < 1200) {
			this.logoWidth = 120
		} else {
			this.logoWidth = 130
		}
	}

	async LoadPublisher() {
		let response = await this.apiService.RetrievePublisher({
			uuid: this.uuid,
			fields: [
				PublisherField.uuid,
				PublisherField.name,
				PublisherField.description,
				PublisherField.websiteUrl,
				PublisherField.facebookUsername,
				PublisherField.instagramUsername,
				PublisherField.twitterUsername,
				PublisherField.logo
			]
		})

		if (isSuccessStatusCode(response.status)) {
			let responseData = (response as ApiResponse<PublisherResource>).data
			this.publisher = new Publisher(responseData, this.apiService, this.cachingService)
		}
	}

	LogoFileSelected(file: ReadFile) {
		this.errorMessage = ""
		this.logoDialogVisible = true

		this.logoDialogImage.nativeElement.onload = () => {
			this.logoCropper = new Cropper(this.logoDialogImage.nativeElement, {
				aspectRatio: 1,
				autoCropArea: 1,
				viewMode: 2
			})
		}

		this.logoDialogImage.nativeElement.src = file.content
	}

	async UploadLogo() {
		this.logoDialogVisible = false
		let oldLogoContent = this.logoContent

		let canvas = this.logoCropper.getCroppedCanvas()
		let blob = await new Promise<Blob>((r: Function) => 
			canvas.toBlob((blob: Blob) => r(blob), "image/jpeg", 0.5)
		)
		this.logoCropper.destroy()

		if (blob.size > maxLogoFileSize) {
			this.errorMessage = this.locale.errors.logoFileTooLarge
			return
		}

		this.logoLoading = true
		this.logoContent = canvas.toDataURL("image/png")

		// Send the file content to the server
		let response: ApiResponse<PublisherLogoResource> | ApiErrorResponse

		if (this.publisherMode == PublisherMode.PublisherOfUser) {
			response = await this.apiService.UploadPublisherLogo({
				uuid: "mine",
				type: blob.type,
				file: blob
			})
		} else {
			response = await this.apiService.UploadPublisherLogo({
				uuid: this.uuid,
				type: blob.type,
				file: blob
			})
		}

		if (isSuccessStatusCode(response.status)) {
			await this.publisher.ReloadLogo()
		} else {
			// Show the old logo
			this.logoContent = oldLogoContent
			this.errorMessage = this.locale.errors.logoUploadFailed
		}

		this.logoLoading = false
	}
}