import { ApiResponse, isSuccessStatusCode, PromiseHolder } from "dav-js"
import { Language, AuthorResource2, AuthorBioResource2 } from "../misc/types"
import { GraphQLService } from "src/app/services/graphql-service"
import { StoreBookCollection } from "src/app/models/StoreBookCollection"
import { StoreBookSeries } from "src/app/models/StoreBookSeries"

export class Author {
	public uuid: string
	public publisher: string
	public firstName: string
	public lastName: string
	public websiteUrl: string
	public facebookUsername: string
	public instagramUsername: string
	public twitterUsername: string
	public profileImage: {
		url: string
		blurhash: string
	}
	private profileImageContent: string
	private bios: {
		loaded: boolean
		isLoading: boolean
		itemsPromiseHolder: PromiseHolder<AuthorBioResource2[]>
	}
	private collections: {
		loaded: boolean
		isLoading: boolean
		itemsPromiseHolder: PromiseHolder<StoreBookCollection[]>
	}
	private series: {
		loaded: boolean
		isLoading: boolean
		itemsPromiseHolder: PromiseHolder<StoreBookSeries[]>
	}

	constructor(
		authorResource: AuthorResource2,
		private languages: Language[],
		private graphqlService: GraphQLService
	) {
		this.uuid = authorResource?.uuid ?? ""
		this.publisher = authorResource?.publisher?.uuid ?? ""
		this.firstName = authorResource?.firstName ?? ""
		this.lastName = authorResource?.lastName ?? ""
		this.websiteUrl = authorResource?.websiteUrl ?? ""
		this.facebookUsername = authorResource?.facebookUsername ?? ""
		this.instagramUsername = authorResource?.instagramUsername ?? ""
		this.twitterUsername = authorResource?.twitterUsername ?? ""
		this.profileImage = {
			url: authorResource?.profileImage?.url,
			blurhash: authorResource?.profileImage?.blurhash
		}
		this.bios = {
			loaded: false,
			isLoading: false,
			itemsPromiseHolder: new PromiseHolder()
		}
		this.collections = {
			loaded: false,
			isLoading: false,
			itemsPromiseHolder: new PromiseHolder()
		}
		this.series = {
			loaded: false,
			isLoading: false,
			itemsPromiseHolder: new PromiseHolder()
		}
	}

	async GetProfileImageContent(): Promise<string> {
		if (this.profileImageContent != null) {
			return this.profileImageContent
		}

		if (this.profileImage.url == null) return null

		let response = await this.graphqlService.GetFile({
			url: this.profileImage.url
		})
		if (!isSuccessStatusCode(response.status)) return null

		let responseData = (response as ApiResponse<string>).data
		this.profileImageContent = responseData
		return responseData
	}

	async ReloadProfileImage() {
		let response = await this.graphqlService.retrieveAuthor(
			`
				profileImage {
					url
					blurhash
				}
			`,
			{
				uuid: this.uuid
			}
		)
		let responseData = response.data.retrieveAuthor

		if (responseData != null) {
			this.profileImage.url = responseData.profileImage.url
			this.profileImage.blurhash = responseData.profileImage.blurhash
			this.profileImageContent = null
		}
	}

	async GetBios(): Promise<AuthorBioResource2[]> {
		if (this.bios.isLoading || this.bios.loaded) {
			let items = []

			for (let item of await this.bios.itemsPromiseHolder.AwaitResult()) {
				items.push(item)
			}

			return items
		}

		this.bios.isLoading = true
		this.bios.itemsPromiseHolder.Setup()

		// Get the bios of the author
		let response = await this.graphqlService.retrieveAuthor(
			`
				bios {
					uuid
					bio
					language
				}
			`,
			{
				uuid: this.uuid
			}
		)
		let responseData = response.data.retrieveAuthor

		if (responseData == null) {
			this.bios.isLoading = false
			this.bios.itemsPromiseHolder.Resolve([])
			return []
		}

		this.bios.loaded = true
		this.bios.isLoading = false
		let items = []

		for (let item of responseData.bios.items) {
			items.push(item)
		}

		this.bios.itemsPromiseHolder.Resolve(items)
		return items
	}

	ClearBios() {
		this.bios.loaded = false
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

		// Get the collections of the author
		let response = await this.graphqlService.retrieveAuthor(
			`
				collections {
					uuid
					author {
						uuid
					}
					name {
						name
						language
					}
				}
			`,
			{
				uuid: this.uuid,
				languages: this.languages
			}
		)
		let responseData = response.data.retrieveAuthor

		if (responseData == null) {
			this.collections.isLoading = false
			this.collections.itemsPromiseHolder.Resolve([])
			return []
		}

		this.collections.loaded = true
		this.collections.isLoading = false
		let items = []

		for (let item of responseData.collections.items) {
			items.push(new StoreBookCollection(item, this.graphqlService))
		}

		this.collections.itemsPromiseHolder.Resolve(items)
		return items
	}

	ClearCollections() {
		this.collections.loaded = false
	}

	async GetSeries(): Promise<StoreBookSeries[]> {
		if (this.series.isLoading || this.series.loaded) {
			let items = []

			for (let item of await this.series.itemsPromiseHolder.AwaitResult()) {
				items.push(item)
			}

			return items
		}

		this.series.isLoading = true
		this.series.itemsPromiseHolder.Setup()

		// Get the series of the author
		let response = await this.graphqlService.retrieveAuthor(
			`
				series {
					uuid
					name
					language
				}
			`,
			{
				uuid: this.uuid
			}
		)
		let responseData = response.data.retrieveAuthor

		this.series.loaded = true
		this.series.isLoading = false
		let items = []

		if (responseData != null) {
			for (let item of responseData.series.items) {
				items.push(
					new StoreBookSeries(
						{
							uuid: item.uuid,
							author: this.uuid,
							name: item.name,
							language: item.language
						},
						this.graphqlService
					)
				)
			}

			this.series.itemsPromiseHolder.Resolve(items)
		}

		return items
	}

	ClearSeries() {
		this.series.loaded = false
	}
}
