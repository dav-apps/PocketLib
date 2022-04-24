import { ApiResponse, isSuccessStatusCode, PromiseHolder } from "dav-js"
import {
	BookStatus,
	Language,
	StoreBookResource,
	StoreBookReleaseResource,
	StoreBookReleaseListField,
	ListResponseData
} from "../misc/types"
import { GetBookStatusByString, GetLanguageByString } from "../misc/utils"
import { ApiService } from "../services/api-service"

export class StoreBook {
	public uuid: string
	public collection: string
	public title: string
	public description: string
	public language: Language
	public price: number
	public isbn: string
	public status: BookStatus
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

	constructor(storeBookResource: StoreBookResource, private apiService: ApiService) {
		this.uuid = storeBookResource.uuid
		this.collection = storeBookResource.collection
		this.title = storeBookResource.title
		this.description = storeBookResource.description
		this.language = GetLanguageByString(storeBookResource.language)
		this.price = storeBookResource.price
		this.isbn = storeBookResource.isbn
		this.status = GetBookStatusByString(storeBookResource.status)
		this.cover = {
			url: storeBookResource.cover?.url,
			aspectRatio: storeBookResource.cover?.aspectRatio,
			blurhash: storeBookResource.cover?.blurhash
		}
		this.file = {
			fileName: storeBookResource.file?.fileName
		}
		this.categories = storeBookResource.categories
		this.releases = { loaded: false, isLoading: false, itemsPromiseHolder: new PromiseHolder() }
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

	async GetReleases(): Promise<StoreBookReleaseResource[]> {
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
		let response = await this.apiService.ListStoreBookReleases({
			storeBook: this.uuid,
			fields: [
				StoreBookReleaseListField.items_uuid,
				StoreBookReleaseListField.items_storeBook,
				StoreBookReleaseListField.items_releaseName,
				StoreBookReleaseListField.items_releaseNotes,
				StoreBookReleaseListField.items_title,
				StoreBookReleaseListField.items_description,
				StoreBookReleaseListField.items_price,
				StoreBookReleaseListField.items_isbn,
				StoreBookReleaseListField.items_status,
				StoreBookReleaseListField.items_cover,
				StoreBookReleaseListField.items_file,
				StoreBookReleaseListField.items_categories
			]
		})

		if (!isSuccessStatusCode(response.status)) {
			this.releases.isLoading = false
			this.releases.itemsPromiseHolder.Resolve([])
			return []
		}

		this.releases.loaded = true
		this.releases.isLoading = false
		let responseData = (response as ApiResponse<ListResponseData<StoreBookReleaseResource>>).data
		let items = []

		for (let item of responseData.items) {
			items.push(item)
		}

		this.releases.itemsPromiseHolder.Resolve(items)
		return items
	}
}