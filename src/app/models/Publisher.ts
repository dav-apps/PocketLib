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
		page: number,
		pages: number,
		limit: number,
		loaded: boolean
		isLoading: boolean
		itemsPromiseHolder: PromiseHolder<Author[]>
	}[]

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
		this.authors = []
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

	async GetAuthors(page: number = -1, limit: number = 50): Promise<Author[]> {
		if (limit <= 0) limit = 1
		let authorItem = this.authors.find(item => item.page == page && item.limit == limit)

		if (authorItem != null && (authorItem.isLoading || authorItem.loaded)) {
			let items = []

			for (let item of await authorItem.itemsPromiseHolder.AwaitResult()) {
				items.push(item)
			}

			return items
		}

		authorItem = {
			page,
			pages: 1,
			limit,
			loaded: false,
			isLoading: true,
			itemsPromiseHolder: new PromiseHolder<Author[]>()
		}
		this.authors.push(authorItem)
		let items = []

		if (page == -1) {
			// Get all authors of the publisher
			let authorPage = 0

			while (authorItem.pages > authorPage) {
				authorPage++

				let response = await this.apiService.ListAuthors({
					publisher: this.uuid,
					fields: [
						AuthorListField.pages,
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
					languages: this.languages,
					limit,
					page: authorPage
				})

				if (isSuccessStatusCode(response.status)) {
					let responseData = (response as ApiResponse<ListResponseData<AuthorResource>>).data
					authorItem.pages = responseData.pages

					for (let item of responseData.items) {
						items.push(new Author(item, this.languages, this.apiService, this.cachingService))
					}
				} else {
					authorItem.isLoading = false
					authorItem.itemsPromiseHolder.Resolve([])
					return null
				}
			}
		} else {
			let response = await this.apiService.ListAuthors({
				publisher: this.uuid,
				fields: [
					AuthorListField.pages,
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
				languages: this.languages,
				limit,
				page
			})

			if (isSuccessStatusCode(response.status)) {
				let responseData = (response as ApiResponse<ListResponseData<AuthorResource>>).data
				authorItem.pages = responseData.pages

				for (let item of responseData.items) {
					items.push(new Author(item, this.languages, this.apiService, this.cachingService))
				}
			} else {
				authorItem.isLoading = false
				authorItem.itemsPromiseHolder.Resolve([])
				return null
			}
		}

		authorItem.loaded = true
		authorItem.isLoading = false
		authorItem.itemsPromiseHolder.Resolve(items)
		return items
	}

	GetAuthorPages(page: number = -1, limit: number = 50) {
		let authorItem = this.authors.find(item => item.page == page && item.limit == limit)

		if (authorItem != null) {
			return authorItem.pages
		} else {
			return 1
		}
	}

	ClearAuthors() {
		this.authors = []
		this.cachingService.ClearApiRequestCache(this.apiService.ListAuthors.name)
	}
}