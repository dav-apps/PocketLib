import { isSuccessStatusCode } from "dav-js"
import { ApiService } from "src/app/services/api-service"
import {
	StoreBookStatus,
	Language,
	List,
	ApiResponse,
	StoreBookResource
} from "../misc/types"
import { GetStoreBookStatusByString, GetLanguageByString } from "../misc/utils"
import { StoreBookCollection } from "./StoreBookCollection"
import { StoreBookRelease } from "./StoreBookRelease"
import { Category } from "./Category"

export class StoreBook {
	public uuid: string
	public slug: string
	public title: string
	public description: string
	public language: Language
	public price: number
	public printPrice: number
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
	public printCover: {
		fileName: string
	}
	public printFile: {
		fileName: string
	}
	private coverContent: string

	constructor(
		storeBookResource: StoreBookResource,
		private languages: Language[],
		private apiService: ApiService
	) {
		if (storeBookResource != null) {
			if (storeBookResource.uuid != null) this.uuid = storeBookResource.uuid
			if (storeBookResource.slug != null) this.slug = storeBookResource.slug
			if (storeBookResource.title != null)
				this.title = storeBookResource.title
			if (storeBookResource.description != null)
				this.description = storeBookResource.description
			if (storeBookResource.language != null)
				this.language = GetLanguageByString(storeBookResource.language)
			if (storeBookResource.price != null)
				this.price = storeBookResource.price
			if (storeBookResource.printPrice != null)
				this.printPrice = storeBookResource.printPrice
			if (storeBookResource.isbn != null) this.isbn = storeBookResource.isbn
			if (storeBookResource.status != null)
				this.status = GetStoreBookStatusByString(storeBookResource.status)
			this.cover = {
				url: storeBookResource.cover?.url,
				aspectRatio: storeBookResource.cover?.aspectRatio,
				blurhash: storeBookResource.cover?.blurhash
			}
			this.file = {
				fileName: storeBookResource.file?.fileName
			}
			this.printCover = {
				fileName: storeBookResource.printCover?.fileName
			}
			this.printFile = {
				fileName: storeBookResource.printFile?.fileName
			}
		}
	}

	static async Retrieve(
		uuid: string,
		languages: Language[],
		apiService: ApiService
	): Promise<StoreBook> {
		let response = await apiService.retrieveStoreBook(
			`
				uuid
				slug
				title
				description
				language
				price
				printPrice
				isbn
				status
				cover {
					url
					aspectRatio
					blurhash
				}
				file {
					fileName
				}
				printCover {
					fileName
				}
				printFile {
					fileName
				}
			`,
			{ uuid }
		)

		let responseData = response.data.retrieveStoreBook
		if (responseData == null) return null

		return new StoreBook(responseData, languages, apiService)
	}

	async GetCoverContent(): Promise<string> {
		if (this.coverContent != null) {
			return this.coverContent
		}

		if (this.cover.url == null) return null

		let response = await this.apiService.downloadFile(this.cover.url)
		if (!isSuccessStatusCode(response.status)) return null

		let responseData = (response as ApiResponse<string>).data
		this.coverContent = responseData
		return responseData
	}

	async GetCollection(): Promise<StoreBookCollection> {
		let response = await this.apiService.retrieveStoreBook(
			`
				collection {
					uuid
				}
			`,
			{ uuid: this.uuid }
		)

		let responseData = response.data.retrieveStoreBook
		if (responseData == null) return null

		return await StoreBookCollection.Retrieve(
			responseData.collection.uuid,
			this.languages,
			this.apiService
		)
	}

	async GetReleases(params?: {
		limit?: number
		offset?: number
	}): Promise<List<StoreBookRelease>> {
		let response = await this.apiService.retrieveStoreBook(
			`
				releases {
					total
					items {
						uuid
					}
				}
			`,
			{
				uuid: this.uuid,
				limit: params?.limit,
				offset: params?.offset
			}
		)

		let responseData = response.data.retrieveStoreBook
		if (responseData == null) return { total: 0, items: [] }

		let items = []

		for (let item of responseData.releases.items) {
			items.push(
				await StoreBookRelease.Retrieve(
					item.uuid,
					this.languages,
					this.apiService
				)
			)
		}

		return {
			total: responseData.releases.total,
			items
		}
	}

	async GetCategories(params?: {
		limit?: number
		offset?: number
	}): Promise<List<Category>> {
		let response = await this.apiService.retrieveStoreBook(
			`
				categories(limit: $limit, offset: $offset) {
					total
					items {
						uuid
					}
				}
			`,
			{
				uuid: this.uuid,
				limit: params?.limit,
				offset: params?.offset
			}
		)

		let responseData = response.data.retrieveStoreBook
		if (responseData == null) return { total: 0, items: [] }

		let items = []

		for (let item of responseData.categories.items) {
			items.push(
				await Category.Retrieve(item.uuid, this.languages, this.apiService)
			)
		}

		return {
			total: responseData.categories.total,
			items
		}
	}
}
