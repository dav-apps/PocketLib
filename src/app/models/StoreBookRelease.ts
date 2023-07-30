import { ApiResponse, isSuccessStatusCode } from "dav-js"
import {
	StoreBookReleaseStatus,
	StoreBookReleaseResource2
} from "src/app/misc/types"
import { GetStoreBookReleaseStatusByString } from "../misc/utils"
import { ApiService } from "../services/api-service"

export class StoreBookRelease {
	public uuid: string
	public storeBook: string
	public releaseName: string
	public releaseNotes: string
	public title: string
	public description: string
	public price: number
	public isbn: string
	public status: StoreBookReleaseStatus
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

	constructor(
		storeBookRelease: StoreBookReleaseResource2,
		private apiService: ApiService
	) {
		this.uuid = storeBookRelease.uuid
		this.storeBook = storeBookRelease.storeBook?.uuid
		this.releaseName = storeBookRelease.releaseName
		this.releaseNotes = storeBookRelease.releaseNotes
		this.title = storeBookRelease.title
		this.description = storeBookRelease.description
		this.price = storeBookRelease.price
		this.isbn = storeBookRelease.isbn
		this.status = GetStoreBookReleaseStatusByString(storeBookRelease.status)
		this.cover = {
			url: storeBookRelease.cover?.url,
			aspectRatio: storeBookRelease.cover?.aspectRatio,
			blurhash: storeBookRelease.cover?.blurhash
		}
		this.file = {
			fileName: storeBookRelease.file?.fileName
		}

		this.categories = []

		for (let category of storeBookRelease.categories.items) {
			this.categories.push(category.key)
		}
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
}
