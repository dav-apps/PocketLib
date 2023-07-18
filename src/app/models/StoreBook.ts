import { ApiResponse, isSuccessStatusCode, PromiseHolder } from "dav-js"
import { ApiService } from "../services/api-service"
import { GraphQLService } from "../services/graphql-service"
import { CachingService } from "../services/caching-service"
import { StoreBookRelease } from "./StoreBookRelease"
import {
	StoreBookStatus,
	Language,
	StoreBookResource2,
	StoreBookReleaseResource
} from "../misc/types"
import { GetStoreBookStatusByString, GetLanguageByString } from "../misc/utils"

export class StoreBook {
	public uuid: string
	public collection: string
	public title: string
	public description: string
	public language: Language
	public price: number
	public isbn: string
	public status: StoreBookStatus
	public cover: {
		url: string
		aspectRatio: string
		blurhash: string
	}
	public file: {
		fileName: string
	}
	public categories: string[]
	private coverContent: string
	private releases: {
		loaded: boolean
		isLoading: boolean
		itemsPromiseHolder: PromiseHolder<StoreBookReleaseResource[]>
	}

	constructor(
		storeBookResource: StoreBookResource2,
		private apiService: ApiService,
		private graphqlService: GraphQLService,
		private cachingService: CachingService
	) {
		this.uuid = storeBookResource.uuid
		this.collection = storeBookResource.collection?.uuid
		this.title = storeBookResource.title
		this.description = storeBookResource.description
		this.language = GetLanguageByString(storeBookResource.language)
		this.price = storeBookResource.price
		this.isbn = storeBookResource.isbn
		this.status = GetStoreBookStatusByString(storeBookResource.status)
		this.cover = {
			url: storeBookResource.cover?.url,
			aspectRatio: storeBookResource.cover?.aspectRatio,
			blurhash: storeBookResource.cover?.blurhash
		}
		this.file = {
			fileName: storeBookResource.file?.fileName
		}

		this.categories = []

		for (let category of storeBookResource.categories.items) {
			this.categories.push(category.key)
		}

		this.releases = {
			loaded: false,
			isLoading: false,
			itemsPromiseHolder: new PromiseHolder()
		}
	}

	async GetCoverContent(): Promise<string> {
		if (this.coverContent != null) {
			return this.coverContent
		}

		if (this.cover.url == null) return null

		let response = await this.apiService.GetFile({ url: this.cover.url })
		if (!isSuccessStatusCode(response.status)) return null

		let responseData = (response as ApiResponse<string>).data
		this.coverContent = responseData
		return responseData
	}

	async GetReleases(): Promise<StoreBookRelease[]> {
		if (this.releases.isLoading || this.releases.loaded) {
			let items = []

			for (let item of await this.releases.itemsPromiseHolder.AwaitResult()) {
				items.push(item)
			}

			return items
		}

		this.releases.isLoading = true
		this.releases.itemsPromiseHolder.Setup()

		// Get the releases of the store book
		let response = await this.graphqlService.retrieveStoreBook(
			`
				releases {
					items {
						uuid
						storeBook {
							uuid
						}
						releaseName
						releaseNotes
						title
						description
						price
						isbn
						status
						cover {
							uuid
						}
						file {
							uuid
						}
						categories {
							items {
								uuid
							}
						}
					}
				}
			`,
			{
				uuid: this.uuid
			}
		)
		let responseData = response.data.retrieveStoreBook

		if (responseData != null) {
			this.releases.isLoading = false
			this.releases.itemsPromiseHolder.Resolve([])
			return []
		}

		this.releases.loaded = true
		this.releases.isLoading = false
		let items = []

		for (let item of responseData.releases.items) {
			items.push(new StoreBookRelease(item, this.apiService))
		}

		this.releases.itemsPromiseHolder.Resolve(items)
		return items
	}

	ClearReleases() {
		this.releases.loaded = false
		this.cachingService.ClearApiRequestCache(
			this.apiService.ListStoreBookReleases.name
		)
	}
}
