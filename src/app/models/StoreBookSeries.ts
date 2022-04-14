import { ApiResponse, isSuccessStatusCode, PromiseHolder } from "dav-js"
import {
	ListResponseData,
	Language,
	StoreBookCollectionResource,
	StoreBookCollectionListField,
	StoreBookSeriesResource,
	StoreBookSeriesNameResource,
	StoreBookSeriesNameListField
} from "../misc/types"
import { GetAllLanguages, GetLanguageByString } from "../misc/utils"
import { ApiService } from "../services/api-service"
import { StoreBookCollection } from "./StoreBookCollection"

export class StoreBookSeries {
	public uuid: string
	public author: string
	public name: {
		value: string
		language: Language
	}
	private names: {
		loaded: boolean
		isLoading: boolean
		itemsPromiseHolder: PromiseHolder<StoreBookSeriesNameResource[]>
	}
	private collections: {
		loaded: boolean
		isLoading: boolean
		itemsPromiseHolder: PromiseHolder<StoreBookCollectionResource[]>
	}

	constructor(seriesResource: StoreBookSeriesResource, private apiService: ApiService) {
		this.uuid = seriesResource?.uuid ?? ""
		this.author = seriesResource?.author ?? ""
		this.name = {
			value: seriesResource?.name?.value ?? "",
			language: GetLanguageByString(seriesResource?.name?.language)
		}
		this.names = { loaded: false, isLoading: false, itemsPromiseHolder: new PromiseHolder() }
		this.collections = { loaded: false, isLoading: false, itemsPromiseHolder: new PromiseHolder() }
	}

	async GetNames(): Promise<StoreBookSeriesNameResource[]> {
		if (this.names.isLoading || this.names.loaded) {
			let items = []

			for (let item of await this.names.itemsPromiseHolder.AwaitResult()) {
				items.push(item)
			}

			return items
		}

		this.names.isLoading = true
		this.names.itemsPromiseHolder.Setup()

		// Get the names of the series
		let response = await this.apiService.ListStoreBookSeriesNames({
			uuid: this.uuid,
			fields: [
				StoreBookSeriesNameListField.items_uuid,
				StoreBookSeriesNameListField.items_name,
				StoreBookSeriesNameListField.items_language
			]
		})

		if (!isSuccessStatusCode(response.status)) {
			this.names.isLoading = false
			this.names.itemsPromiseHolder.Resolve([])
			return []
		}

		this.names.loaded = true
		this.names.isLoading = false
		let responseData = (response as ApiResponse<ListResponseData<StoreBookSeriesNameResource>>).data
		let items = []

		for (let item of responseData.items) {
			items.push(item)
		}

		this.names.itemsPromiseHolder.Resolve(items)
		return items
	}

	ClearNames() {
		this.names.loaded = false
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

		// Get the collections of the series
		let response = await this.apiService.ListStoreBookCollections({
			series: this.uuid,
			fields: [
				StoreBookCollectionListField.items_uuid,
				StoreBookCollectionListField.items_author,
				StoreBookCollectionListField.items_name
			],
			languages: GetAllLanguages()
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
}