import { Component, Input, HostListener } from "@angular/core"
import { ApiResponse, ApiErrorResponse, isSuccessStatusCode } from "dav-js"
import { Publisher } from "src/app/models/Publisher"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { PublisherMode, PublisherResource, PublisherField } from "src/app/misc/types"

@Component({
	selector: "pocketlib-publisher-profile",
	templateUrl: "./publisher-profile.component.html"
})
export class PublisherProfileComponent {
	@Input() uuid: string
	publisherMode: PublisherMode = PublisherMode.Normal
	publisher: Publisher = new Publisher(null)
	storeContext: boolean = true		// Whether the component is shown in the Store
	logoContent: string = this.dataService.defaultProfileImageUrl
	logoAlt: string = ""
	logoWidth: number = 200

	constructor(
		public dataService: DataService,
		private apiService: ApiService
	) {
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
			this.publisher = new Publisher(responseData)
		}
	}
}