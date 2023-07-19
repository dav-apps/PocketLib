import { PromiseHolder } from "dav-js"
import {
	Language,
	StoreBookSeriesResource,
	StoreBookResource
} from "../misc/types"
import { GetAllLanguages, GetLanguageByString } from "../misc/utils"
import { ApiService } from "../services/api-service"
import { GraphQLService } from "../services/graphql-service"
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
		private graphqlService: GraphQLService,
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
		let response = await this.graphqlService.retrieveStoreBookSeries(
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
						categories
					}
				}
			`,
			{
				uuid: this.uuid,
				languages: GetAllLanguages()
			}
		)

		let responseData = response.data.retrieveStoreBookSeries

		if (responseData == null) {
			this.storeBooks.isLoading = false
			this.storeBooks.itemsPromiseHolder.Resolve([])
			return []
		}

		this.storeBooks.loaded = true
		this.storeBooks.isLoading = false
		let items = []

		for (let item of responseData.storeBooks.items) {
			items.push(
				new StoreBook(
					item,
					this.apiService,
					this.graphqlService,
					this.cachingService
				)
			)
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
