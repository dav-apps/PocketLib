import { ApiResponse, isSuccessStatusCode, PromiseHolder } from "dav-js"
import {
	Language,
	ListResponseData,
	PublisherResource,
	PublisherLogoResource,
	PublisherLogoField,
	AuthorResource,
	AuthorListField
} from "../misc/types"
import { ApiService } from "src/app/services/api-service"
import { CachingService } from "../services/caching-service"
import { Author } from "./Author"

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
	private authors: {
		loaded: boolean
		isLoading: boolean
		itemsPromiseHolder: PromiseHolder<Author[]>
	}

	constructor(
		publisherResource: PublisherResource,
		private languages: Language[],
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
		this.authors = { loaded: false, isLoading: false, itemsPromiseHolder: new PromiseHolder() }
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

	async GetAuthors(): Promise<Author[]> {
		if (this.authors.isLoading || this.authors.loaded) {
			let items = []

			for (let item of await this.authors.itemsPromiseHolder.AwaitResult()) {
				items.push(item)
			}

			return items
		}

		this.authors.isLoading = true
		this.authors.itemsPromiseHolder.Setup()

		// Get the authors of the publisher
		let response = await this.apiService.ListAuthors({
			publisher: this.uuid,
			fields: [
				AuthorListField.items_uuid,
				AuthorListField.items_publisher,
				AuthorListField.items_firstName,
				AuthorListField.items_lastName,
				AuthorListField.items_bio,
				AuthorListField.items_websiteUrl,
				AuthorListField.items_facebookUsername,
				AuthorListField.items_instagramUsername,
				AuthorListField.items_twitterUsername,
				AuthorListField.items_profileImage
			],
			languages: this.languages
		})

		if (!isSuccessStatusCode(response.status)) {
			this.authors.isLoading = false
			this.authors.itemsPromiseHolder.Resolve([])
			return []
		}

		this.authors.loaded = true
		this.authors.isLoading = false
		let responseData = (response as ApiResponse<ListResponseData<AuthorResource>>).data
		let items = []

		for (let item of responseData.items) {
			items.push(new Author(item, this.languages, this.apiService, this.cachingService))
		}

		this.authors.itemsPromiseHolder.Resolve(items)
		return items
	}

	ClearAuthors() {
		this.authors.loaded = false
		this.cachingService.ClearApiRequestCache(this.apiService.ListAuthors.name)
	}
}