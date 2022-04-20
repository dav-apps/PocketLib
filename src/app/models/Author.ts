import { ApiResponse, isSuccessStatusCode, PromiseHolder } from 'dav-js'
import {
	Language,
	ListResponseData,
	AuthorResource,
	AuthorBioResource,
	AuthorBioListField,
	AuthorProfileImageResource,
	AuthorProfileImageField,
	StoreBookCollectionResource,
	StoreBookCollectionListField,
	StoreBookSeriesResource,
	StoreBookSeriesListField
} from "../misc/types"
import { ApiService } from 'src/app/services/api-service'
import { CachingService } from '../services/caching-service'
import { StoreBookCollection } from 'src/app/models/StoreBookCollection'
import { StoreBookSeries } from 'src/app/models/StoreBookSeries'

export class Author {
	public uuid: string
	public firstName: string
	public lastName: string
	public websiteUrl: string
	public facebookUsername: string
	public instagramUsername: string
	public twitterUsername: string
	public profileImage: {
		url: string
		blurhash: string
	}
	private bios: {
		loaded: boolean
		isLoading: boolean
		itemsPromiseHolder: PromiseHolder<AuthorBioResource[]>
	}
	private collections: {
		loaded: boolean
		isLoading: boolean
		itemsPromiseHolder: PromiseHolder<StoreBookCollection[]>
	}
	private series: {
		loaded: boolean
		isLoading: boolean
		itemsPromiseHolder: PromiseHolder<StoreBookSeries[]>
	}

	constructor(
		authorResource: AuthorResource,
		private languages: Language[],
		private apiService: ApiService,
		private cachingService: CachingService
	) {
		this.uuid = authorResource?.uuid ?? ""
		this.firstName = authorResource?.firstName ?? ""
		this.lastName = authorResource?.lastName ?? ""
		this.websiteUrl = authorResource?.websiteUrl ?? ""
		this.facebookUsername = authorResource?.facebookUsername ?? ""
		this.instagramUsername = authorResource?.instagramUsername ?? ""
		this.twitterUsername = authorResource?.twitterUsername ?? ""
		this.profileImage = {
			url: authorResource?.profileImage?.url,
			blurhash: authorResource?.profileImage?.blurhash
		}
		this.bios = { loaded: false, isLoading: false, itemsPromiseHolder: new PromiseHolder() }
		this.collections = { loaded: false, isLoading: false, itemsPromiseHolder: new PromiseHolder() }
		this.series = { loaded: false, isLoading: false, itemsPromiseHolder: new PromiseHolder() }
	}

	async ReloadProfileImage() {
		this.cachingService.ClearApiRequestCache(this.apiService.RetrieveAuthorProfileImage.name)

		let response = await this.apiService.RetrieveAuthorProfileImage({
			uuid: this.uuid,
			fields: [
				AuthorProfileImageField.url,
				AuthorProfileImageField.blurhash
			]
		})

		if (isSuccessStatusCode(response.status)) {
			let responseData = (response as ApiResponse<AuthorProfileImageResource>).data

			this.profileImage.url = responseData.url
			this.profileImage.blurhash = responseData.blurhash
		}
	}

	async GetBios(): Promise<AuthorBioResource[]> {
		if (this.bios.isLoading || this.bios.loaded) {
			let items = []

			for (let item of await this.bios.itemsPromiseHolder.AwaitResult()) {
				items.push(item)
			}

			return items
		}

		this.bios.isLoading = true
		this.bios.itemsPromiseHolder.Setup()

		// Get the bios of the author
		let response = await this.apiService.ListAuthorBios({
			uuid: this.uuid,
			fields: [
				AuthorBioListField.items_uuid,
				AuthorBioListField.items_bio,
				AuthorBioListField.items_language
			]
		})

		if (!isSuccessStatusCode(response.status)) {
			this.bios.isLoading = false
			this.bios.itemsPromiseHolder.Resolve([])
			return []
		}

		this.bios.loaded = true
		this.bios.isLoading = false
		let responseData = (response as ApiResponse<ListResponseData<AuthorBioResource>>).data
		let items = []

		for (let item of responseData.items) {
			items.push(item)
		}

		this.bios.itemsPromiseHolder.Resolve(items)
		return items
	}

	ClearBios() {
		this.bios.loaded = false
		this.cachingService.ClearApiRequestCache(this.apiService.ListAuthorBios.name)
	}

	async GetCollections(): Promise<StoreBookCollection[]> {
		if (this.collections.isLoading || this.collections.loaded) {
			let items = []

			for (let item of await this.collections.itemsPromiseHolder.AwaitResult()) {
				items.push(item)
			}

			return items
		}

		this.collections.isLoading = true
		this.collections.itemsPromiseHolder.Setup()

		// Get the collections of the author
		let response = await this.apiService.ListStoreBookCollections({
			author: this.uuid,
			fields: [
				StoreBookCollectionListField.items_uuid,
				StoreBookCollectionListField.items_author,
				StoreBookCollectionListField.items_name
			],
			languages: this.languages
		})

		if (!isSuccessStatusCode(response.status)) {
			this.collections.isLoading = false
			this.collections.itemsPromiseHolder.Resolve([])
			return []
		}

		this.collections.loaded = true
		this.collections.isLoading = false
		let responseData = (response as ApiResponse<ListResponseData<StoreBookCollectionResource>>).data
		let items = []

		for (let item of responseData.items) {
			items.push(new StoreBookCollection(item, this.apiService))
		}

		this.collections.itemsPromiseHolder.Resolve(items)
		return items
	}

	async GetSeries(): Promise<StoreBookSeries[]> {
		if (this.series.isLoading || this.series.loaded) {
			let items = []

			for (let item of await this.series.itemsPromiseHolder.AwaitResult()) {
				items.push(item)
			}

			return items
		}

		this.series.isLoading = true
		this.series.itemsPromiseHolder.Setup()

		// Get the series of the author
		let response = await this.apiService.ListStoreBookSeries({
			author: this.uuid,
			fields: [
				StoreBookSeriesListField.items_uuid,
				StoreBookSeriesListField.items_author,
				StoreBookSeriesListField.items_name
			]
		})

		if (!isSuccessStatusCode(response.status)) {
			this.series.isLoading = false
			this.series.itemsPromiseHolder.Resolve([])
			return []
		}

		this.series.loaded = true
		this.series.isLoading = false
		let responseData = (response as ApiResponse<ListResponseData<StoreBookSeriesResource>>).data
		let items = []

		for (let item of responseData.items) {
			items.push(new StoreBookSeries(item, this.apiService, this.cachingService))
		}

		this.series.itemsPromiseHolder.Resolve(items)
		return items
	}

	ClearSeries() {
		this.series.loaded = false
		this.cachingService.ClearApiRequestCache(this.apiService.ListStoreBookSeries.name)
	}
}