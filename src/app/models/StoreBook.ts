import { ApiResponse, isSuccessStatusCode } from "dav-js"
import { BookStatus, Language, StoreBookResource } from "../misc/types"
import { GetBookStatusByString, GetLanguageByString } from "../misc/utils"
import { ApiService } from "../services/api-service"

export class StoreBook {
	public uuid: string
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

	constructor(storeBookResource: StoreBookResource, private apiService: ApiService) {
		this.uuid = storeBookResource.uuid
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
}