import { ApiResponse, isSuccessStatusCode } from "dav-js"
import { PublisherResource, PublisherLogoResource, PublisherLogoField } from "../misc/types"
import { ApiService } from "src/app/services/api-service"
import { CachingService } from "../services/caching-service"

export class Publisher {
	public uuid: string
	public name: string
	public description: string
	public websiteUrl: string
	public facebookUsername: string
	public instagramUsername: string
	public twitterUsername: string
	public logo: {
		url: string
		blurhash: string
	}

	constructor(
		publisherResource: PublisherResource,
		private apiService: ApiService,
		private cachingService: CachingService
	) {
		this.uuid = publisherResource?.uuid ?? ""
		this.name = publisherResource?.name ?? ""
		this.description = publisherResource?.description ?? ""
		this.websiteUrl = publisherResource?.websiteUrl ?? ""
		this.facebookUsername = publisherResource?.facebookUsername ?? ""
		this.instagramUsername = publisherResource?.instagramUsername ?? ""
		this.twitterUsername = publisherResource?.twitterUsername ?? ""
		this.logo = {
			url: publisherResource?.logo?.url,
			blurhash: publisherResource?.logo?.blurhash
		}
	}

	async ReloadLogo() {
		this.cachingService.ClearApiRequestCache(this.apiService.RetrievePublisherLogo.name)

		let response = await this.apiService.RetrievePublisherLogo({
			uuid: this.uuid,
			fields: [
				PublisherLogoField.url,
				PublisherLogoField.blurhash
			]
		})

		if (isSuccessStatusCode(response.status)) {
			let responseData = (response as ApiResponse<PublisherLogoResource>).data

			this.logo.url = responseData.url
			this.logo.blurhash = responseData.blurhash
		}
	}
}