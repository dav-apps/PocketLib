import { PublisherResource, List } from "../misc/types"
import { DataService } from "../services/data-service"
import { ApiService } from "src/app/services/api-service"
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

	constructor(
		publisherResource: PublisherResource,
		private dataService: DataService,
		private apiService: ApiService
	) {
		if (publisherResource != null) {
			if (publisherResource.uuid != null) this.uuid = publisherResource.uuid
			if (publisherResource.name != null) this.name = publisherResource.name
			if (publisherResource.description != null)
				this.description = publisherResource.description
			if (publisherResource.websiteUrl != null)
				this.websiteUrl = publisherResource.websiteUrl
			if (publisherResource.facebookUsername != null)
				this.facebookUsername = publisherResource.facebookUsername
			if (publisherResource.instagramUsername != null)
				this.instagramUsername = publisherResource.instagramUsername
			if (publisherResource != null)
				this.twitterUsername = publisherResource.twitterUsername
			this.logo = {
				url: publisherResource.logo?.url,
				blurhash: publisherResource.logo?.blurhash
			}
		}
	}

	static async Retrieve(
		uuid: string,
		dataService: DataService,
		apiService: ApiService
	): Promise<Publisher> {
		let response = await apiService.retrievePublisher(
			`
				uuid
				name
				description
				websiteUrl
				facebookUsername
				instagramUsername
				twitterUsername
				logo {
					url
					blurhash
				}
			`,
			{ uuid }
		)

		let responseData = response.data.retrievePublisher
		if (responseData == null) return null

		return new Publisher(responseData, dataService, apiService)
	}

	async ReloadLogo() {
		let response = await this.apiService.retrievePublisher(
			`
				logo {
					url
				}
			`,
			{ uuid: this.uuid }
		)
		let responseData = response.data.retrievePublisher
		this.logo.url = responseData.logo?.url
		this.logo.blurhash = responseData.logo?.blurhash
	}

	async GetAuthors(params?: {
		limit?: number
		offset?: number
		query?: string
	}): Promise<List<Author>> {
		let response = await this.apiService.retrievePublisher(
			`
				authors(
					limit: $limit
					offset: $offset
					query: $query
				) {
					total
					items {
						uuid
					}
				}
			`,
			{
				uuid: this.uuid,
				limit: params.limit,
				offset: params.offset,
				query: params.query
			}
		)

		let responseData = response.data.retrievePublisher
		if (responseData == null) return { total: 0, items: [] }

		let items = []

		for (let item of responseData.authors.items) {
			items.push(
				await Author.Retrieve(item.uuid, this.dataService, this.apiService)
			)
		}

		return {
			total: responseData.authors.total,
			items
		}
	}
}
