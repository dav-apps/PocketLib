import { ApiResponse, isSuccessStatusCode, PromiseHolder } from "dav-js"
import {
	Language,
	ListResponseData,
	StoreBookCollectionResource,
	StoreBookCollectionNameResource,
	StoreBookCollectionNameListField,
	StoreBookResource,
	StoreBookListField
} from "../misc/types"
import { GetLanguageByString } from "../misc/utils"
import { ApiService } from 'src/app/services/api-service'
import { StoreBook } from 'src/app/models/StoreBook'

export class StoreBookCollection {
	public uuid: string
	public author: string
	public name: {
		value: string
		language: Language
	}
	private names: {
		loaded: boolean
		isLoading: boolean
		itemsPromiseHolder: PromiseHolder<StoreBookCollectionNameResource[]>
	}
	private storeBooks: {
		loaded: boolean
		isLoading: boolean
		itemsPromiseHolder: PromiseHolder<StoreBook[]>
	}

	constructor(collectionResource: StoreBookCollectionResource, private apiService: ApiService) {
		this.uuid = collectionResource?.uuid ?? ""
		this.author = collectionResource?.author ?? ""
		this.name = {
			value: collectionResource?.name?.value ?? "",
			language: GetLanguageByString(collectionResource?.name?.language)
		}
		this.names = { loaded: false, isLoading: false, itemsPromiseHolder: new PromiseHolder() }
		this.storeBooks = { loaded: false, isLoading: false, itemsPromiseHolder: new PromiseHolder() }
	}

	async GetNames(): Promise<StoreBookCollectionNameResource[]> {
		if (this.names.isLoading || this.names.loaded) {
			let items = []

			for (let item of await this.names.itemsPromiseHolder.AwaitResult()) {
				items.push(item)
			}

			return items
		}

		this.names.isLoading = true
		this.names.itemsPromiseHolder.Setup()

		// Get the names of the collection
		let response = await this.apiService.ListStoreBookCollectionNames({
			uuid: this.uuid,
			fields: [
				StoreBookCollectionNameListField.items_uuid,
				StoreBookCollectionNameListField.items_name,
				StoreBookCollectionNameListField.items_language
			]
		})

		if (!isSuccessStatusCode(response.status)) {
			this.names.isLoading = false
			this.names.itemsPromiseHolder.Resolve([])
			return []
		}

		this.names.loaded = true
		this.names.isLoading = false
		let responseData = (response as ApiResponse<ListResponseData<StoreBookCollectionNameResource>>).data
		let items = []

		for (let item of responseData.items) {
			items.push(item)
		}

		this.names.itemsPromiseHolder.Resolve(items)
		return items
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

		// Get the store books of the collection
		let response = await this.apiService.ListStoreBooks({
			collection: this.uuid,
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
			]
		})

		if (!isSuccessStatusCode(response.status)) {
			this.storeBooks.isLoading = false
			this.storeBooks.itemsPromiseHolder.Resolve([])
			return []
		}

		this.storeBooks.loaded = true
		this.storeBooks.isLoading = false
		let responseData = (response as ApiResponse<ListResponseData<StoreBookResource>>).data
		let items = []

		for (let item of responseData.items) {
			items.push(new StoreBook(item, this.apiService))
		}

		this.storeBooks.itemsPromiseHolder.Resolve(items)
		return items
	}
}