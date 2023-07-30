import { PromiseHolder } from "dav-js"
import {
	Language,
	StoreBookCollectionResource,
	StoreBookCollectionNameResource
} from "../misc/types"
import { GetLanguageByString } from "../misc/utils"
import { ApiService } from "src/app/services/api-service"
import { StoreBook } from "src/app/models/StoreBook"

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

	constructor(
		collectionResource: StoreBookCollectionResource,
		private apiService: ApiService
	) {
		this.uuid = collectionResource?.uuid ?? ""
		this.author = collectionResource?.author?.uuid ?? ""
		this.name = {
			value: collectionResource?.name?.name ?? "",
			language: GetLanguageByString(collectionResource?.name?.language)
		}
		this.names = {
			loaded: false,
			isLoading: false,
			itemsPromiseHolder: new PromiseHolder()
		}
		this.storeBooks = {
			loaded: false,
			isLoading: false,
			itemsPromiseHolder: new PromiseHolder()
		}
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
		let response = await this.apiService.retrieveStoreBookCollection(
			`
				names {
					items {
						uuid
						name
						language
					}
				}
			`,
			{ uuid: this.uuid }
		)

		let responseData = response.data.retrieveStoreBookCollection

		if (responseData == null) {
			this.names.isLoading = false
			this.names.itemsPromiseHolder.Resolve([])
			return []
		}

		this.names.loaded = true
		this.names.isLoading = false
		let items = []

		for (let item of responseData.names.items) {
			items.push(item)
		}

		this.names.itemsPromiseHolder.Resolve(items)
		return items
	}

	ClearNames() {
		this.names.loaded = false
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
		let response = await this.apiService.retrieveStoreBookCollection(
			`
				storeBooks {
					items {
						uuid
						collection {
							uuid
						}
						title
						description
						language
						price
						isbn
						status
						cover {
							uuid
						}
						file {
							uuid
						}
						inLibrary
						purchased
						categories {
							items {
								key
							}
						}
					}
				}
			`,
			{ uuid: this.uuid }
		)

		let responseData = response.data.retrieveStoreBookCollection

		if (responseData == null) {
			this.storeBooks.isLoading = false
			this.storeBooks.itemsPromiseHolder.Resolve([])
			return []
		}

		this.storeBooks.loaded = true
		this.storeBooks.isLoading = false
		let items = []

		for (let item of responseData.storeBooks.items) {
			items.push(new StoreBook(item, this.apiService))
		}

		this.storeBooks.itemsPromiseHolder.Resolve(items)
		return items
	}

	ClearStoreBooks() {
		this.storeBooks.loaded = false
	}
}
