import { ApiResponse, isSuccessStatusCode, PromiseHolder } from "dav-js"
import {
	ListResponseData,
	Language,
	StoreBookSeriesResource,
	StoreBookResource,
	StoreBookListField
} from "../misc/types"
import { GetAllLanguages, GetLanguageByString } from "../misc/utils"
import { ApiService } from "../services/api-service"
import { CachingService } from "../services/caching-service"
import { StoreBook } from "./StoreBook"

export class StoreBookSeries {
	public uuid: string
	public author: string
	public name: string
	public language: Language
	private storeBooks: {
		loaded: boolean
		isLoading: boolean
		itemsPromiseHolder: PromiseHolder<StoreBookResource[]>
	}

	constructor(
		seriesResource: StoreBookSeriesResource,
		private apiService: ApiService,
		private cachingService: CachingService
	) {
		this.uuid = seriesResource?.uuid ?? ""
		this.author = seriesResource?.author ?? ""
		this.name = seriesResource?.name ?? ""
		this.language = GetLanguageByString(seriesResource?.language)
		this.storeBooks = {
			loaded: false,
			isLoading: false,
			itemsPromiseHolder: new PromiseHolder()
		}
	}

	async GetStoreBooks(): Promise<StoreBook[]> {
		if (this.storeBooks.isLoading || this.storeBooks.loaded) {
			let items = []

			for (let item of await this.storeBooks.itemsPromiseHolder.AwaitResult()) {
				items.push(item)
			}

			return items
		}

		this.storeBooks.isLoading = true
		this.storeBooks.itemsPromiseHolder.Setup()

		// Get the store books of the series
		let response = await this.apiService.ListStoreBooks({
			series: this.uuid,
			fields: [
				StoreBookListField.items_uuid,
				StoreBookListField.items_collection,
				StoreBookListField.items_title,
				StoreBookListField.items_description,
				StoreBookListField.items_language,
				StoreBookListField.items_price,
				StoreBookListField.items_isbn,
				StoreBookListField.items_status,
				StoreBookListField.items_cover,
				StoreBookListField.items_file,
				StoreBookListField.items_inLibrary,
				StoreBookListField.items_purchased,
				StoreBookListField.items_categories
			],
			languages: GetAllLanguages()
		})

		if (!isSuccessStatusCode(response.status)) {
			this.storeBooks.isLoading = false
			this.storeBooks.itemsPromiseHolder.Resolve([])
			return []
		}

		this.storeBooks.loaded = true
		this.storeBooks.isLoading = false
		let responseData = (
			response as ApiResponse<ListResponseData<StoreBookResource>>
		).data
		let items = []

		for (let item of responseData.items) {
			items.push(new StoreBook(item, this.apiService, this.cachingService))
		}

		this.storeBooks.itemsPromiseHolder.Resolve(items)
		return items
	}

	ClearStoreBooks() {
		this.storeBooks.loaded = false
		this.cachingService.ClearApiRequestCache(
			this.apiService.ListStoreBooks.name
		)
	}
}
