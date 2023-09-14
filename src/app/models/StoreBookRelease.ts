import { isSuccessStatusCode } from "dav-js"
import {
	StoreBookReleaseStatus,
	ApiResponse,
	List,
	StoreBookReleaseResource
} from "src/app/misc/types"
import { GetStoreBookReleaseStatusByString } from "../misc/utils"
import { ApiService } from "../services/api-service"
import { DataService } from "../services/data-service"
import { Category } from "./Category"

export class StoreBookRelease {
	public uuid: string
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
	private coverContent: string

	constructor(
		releaseResource: StoreBookReleaseResource,
		private dataService: DataService,
		private apiService: ApiService
	) {
		if (releaseResource != null) {
			if (releaseResource.uuid != null) this.uuid = releaseResource.uuid
			if (releaseResource.releaseName != null)
				this.releaseName = releaseResource.releaseName
			if (releaseResource.releaseNotes != null)
				this.releaseNotes = releaseResource.releaseNotes
			if (releaseResource.title != null) this.title = releaseResource.title
			if (releaseResource.description != null)
				this.description = releaseResource.description
			if (releaseResource.price != null) this.price = releaseResource.price
			if (releaseResource.isbn != null) this.isbn = releaseResource.isbn
			if (releaseResource.status != null)
				this.status = GetStoreBookReleaseStatusByString(
					releaseResource.status
				)
			this.cover = {
				url: releaseResource.cover?.url,
				aspectRatio: releaseResource.cover?.aspectRatio,
				blurhash: releaseResource.cover?.blurhash
			}
			this.file = {
				fileName: releaseResource.file?.fileName
			}
		}
	}

	static async Retrieve(
		uuid: string,
		dataService: DataService,
		apiService: ApiService
	): Promise<StoreBookRelease> {
		let response = await apiService.retrieveStoreBookRelease(
			`
				uuid
				releaseName
				releaseNotes
				title
				description
				price
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
			`,
			{ uuid }
		)

		let responseData = response.data.retrieveStoreBookRelease
		if (responseData == null) return null

		return new StoreBookRelease(responseData, dataService, apiService)
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

	async GetCategories(params?: {
		limit?: number
		offset?: number
	}): Promise<List<Category>> {
		let response = await this.apiService.retrieveStoreBookRelease(
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

		let responseData = response.data.retrieveStoreBookRelease
		if (responseData == null) return { total: 0, items: [] }

		let items = []

		for (let item of responseData.categories.items) {
			items.push(
				await Category.Retrieve(
					item.uuid,
					this.dataService,
					this.apiService
				)
			)
		}

		return {
			total: responseData.categories.total,
			items
		}
	}
}
