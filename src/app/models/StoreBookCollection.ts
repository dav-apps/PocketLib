import {
	StoreBookCollectionResource,
	StoreBookCollectionNameResource,
	Language,
	List
} from "../misc/types"
import { GetLanguageByString } from "../misc/utils"
import { ApiService } from "src/app/services/api-service"
import { StoreBook } from "./StoreBook"
import { StoreBookCollectionName } from "./StoreBookCollectionName"

export class StoreBookCollection {
	public uuid: string
	public name: {
		name: string
		language: Language
	}

	constructor(
		collectionResource: StoreBookCollectionResource,
		private languages: Language[],
		private apiService: ApiService
	) {
		if (collectionResource != null) {
			if (collectionResource.uuid != null)
				this.uuid = collectionResource.uuid
			this.name = {
				name: collectionResource.name?.name,
				language: GetLanguageByString(collectionResource.name?.language)
			}
		}
	}

	static async Retrieve(
		uuid: string,
		languages: Language[],
		apiService: ApiService
	): Promise<StoreBookCollection> {
		let response = await apiService.retrieveStoreBookCollection(
			`
				name(languages: $languages) {
					name
					language
				}
			`,
			{
				uuid,
				languages
			}
		)

		let responseData = response.data.retrieveStoreBookCollection
		if (responseData == null) return null

		return new StoreBookCollection(
			{ uuid, ...responseData },
			languages,
			apiService
		)
	}

	async GetNames(params?: {
		limit?: number
		offset?: number
	}): Promise<List<StoreBookCollectionNameResource>> {
		let response = await this.apiService.retrieveStoreBookCollection(
			`
				names(limit: $limit, offset: $offset) {
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

		let responseData = response.data.retrieveStoreBookCollection
		if (responseData == null) return { total: 0, items: [] }

		let items = []

		for (let item of responseData.names.items) {
			items.push(
				await StoreBookCollectionName.Retrieve(item.uuid, this.apiService)
			)
		}

		return {
			total: responseData.names.total,
			items
		}
	}

	async GetStoreBooks(params?: {
		limit?: number
		offset?: number
	}): Promise<List<StoreBook>> {
		let response = await this.apiService.retrieveStoreBookCollection(
			`
				storeBooks {
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

		let responseData = response.data.retrieveStoreBookCollection
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
