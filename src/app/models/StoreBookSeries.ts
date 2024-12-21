import { List, Language, StoreBookSeriesResource } from "../misc/types"
import { GetLanguageByString } from "../misc/utils"
import { ApiService } from "src/app/services/api-service"
import { StoreBook } from "./StoreBook"

export class StoreBookSeries {
	public uuid: string
	public name: string
	public language: Language

	constructor(
		seriesResource: StoreBookSeriesResource,
		private languages: Language[],
		private apiService: ApiService
	) {
		if (seriesResource != null) {
			if (seriesResource.uuid != null) this.uuid = seriesResource.uuid
			if (seriesResource.name != null) this.name = seriesResource.name
			if (seriesResource.language != null)
				this.language = GetLanguageByString(seriesResource.language)
		}
	}

	static async Retrieve(
		uuid: string,
		languages: Language[],
		apiService: ApiService
	): Promise<StoreBookSeries> {
		let response = await apiService.retrieveStoreBookSeries(
			`
				name
				language
			`,
			{ uuid }
		)

		let responseData = response.data.retrieveStoreBookSeries
		if (responseData == null) return null

		return new StoreBookSeries(
			{ uuid, ...responseData },
			languages,
			apiService
		)
	}

	async GetStoreBooks(params?: {
		limit?: number
		offset?: number
	}): Promise<List<StoreBook>> {
		let response = await this.apiService.retrieveStoreBookSeries(
			`
				storeBooks(limit: $limit, offset: $offset) {
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

		let responseData = response.data.retrieveStoreBookSeries
		if (responseData == null) return { total: 0, items: [] }

		let items = []

		for (let item of responseData.storeBooks.items) {
			items.push(
				await StoreBook.Retrieve(item.uuid, this.languages, this.apiService)
			)
		}

		return {
			total: responseData.storeBooks.total,
			items
		}
	}
}
