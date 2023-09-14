import { isSuccessStatusCode } from "dav-js"
import {
	ApiResponse,
	AuthorResource,
	AuthorBioResource,
	Language,
	List
} from "../misc/types"
import { GetLanguageByString } from "../misc/utils"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { StoreBookCollection } from "src/app/models/StoreBookCollection"
import { StoreBookSeries } from "src/app/models/StoreBookSeries"

export class Author {
	public uuid: string
	public firstName: string
	public lastName: string
	public bio: {
		bio: string
		language: Language
	}
	public websiteUrl: string
	public facebookUsername: string
	public instagramUsername: string
	public twitterUsername: string
	public profileImage: {
		url: string
		blurhash: string
	}
	private profileImageContent: string

	constructor(
		authorResource: AuthorResource,
		private dataService: DataService,
		private apiService: ApiService
	) {
		if (authorResource != null) {
			if (authorResource.uuid != null) this.uuid = authorResource.uuid
			if (authorResource.firstName != null)
				this.firstName = authorResource.firstName
			if (authorResource.lastName != null)
				this.lastName = authorResource.lastName
			this.bio = {
				bio: authorResource.bio?.bio,
				language: GetLanguageByString(authorResource.bio?.language)
			}
			if (authorResource.websiteUrl != null)
				this.websiteUrl = authorResource.websiteUrl
			if (authorResource.facebookUsername != null)
				this.facebookUsername = authorResource.facebookUsername
			if (authorResource.instagramUsername != null)
				this.instagramUsername = authorResource.instagramUsername
			if (authorResource.twitterUsername != null)
				this.twitterUsername = authorResource.twitterUsername
			this.profileImage = {
				url: authorResource.profileImage?.url,
				blurhash: authorResource.profileImage?.blurhash
			}
		}
	}

	static async Retrieve(
		uuid: string,
		dataService: DataService,
		apiService: ApiService
	): Promise<Author> {
		let response = await apiService.retrieveAuthor(
			`
				uuid
				firstName
				lastName
				bio(languages: $languages) {
					bio
					language
				}
				websiteUrl
				facebookUsername
				instagramUsername
				twitterUsername
				profileImage {
					url
					blurhash
				}
			`,
			{
				uuid,
				languages: await dataService.GetStoreLanguages()
			}
		)

		let responseData = response.data.retrieveAuthor
		if (responseData == null) return null

		return new Author(responseData, dataService, apiService)
	}

	async GetProfileImageContent(): Promise<string> {
		if (this.profileImageContent != null) {
			return this.profileImageContent
		}

		if (this.profileImage.url == null) return null

		let response = await this.apiService.downloadFile(this.profileImage.url)
		if (!isSuccessStatusCode(response.status)) return null

		let responseData = (response as ApiResponse<string>).data
		this.profileImageContent = responseData
		return responseData
	}

	async ReloadProfileImage() {
		let response = await this.apiService.retrieveAuthor(
			`
				profileImage {
					url
					blurhash
				}
			`,
			{ uuid: this.uuid }
		)
		let responseData = response.data.retrieveAuthor

		if (responseData != null) {
			this.profileImage.url = responseData.profileImage.url
			this.profileImage.blurhash = responseData.profileImage.blurhash
			this.profileImageContent = null
		}
	}

	async GetBios(params?: {
		limit?: number
		offset?: number
	}): Promise<List<AuthorBioResource>> {
		// Get the bios of the author
		let response = await this.apiService.retrieveAuthor(
			`
				bios(limit: $limit, offset: $offset) {
					total
					items {
						uuid
						bio
						language
					}
				}
			`,
			{
				uuid: this.uuid,
				limit: params?.limit,
				offset: params?.offset
			}
		)
		let responseData = response.data.retrieveAuthor
		if (responseData == null) return { total: 0, items: [] }

		let items = []

		for (let item of responseData.bios.items) {
			items.push(item)
		}

		return {
			total: responseData.bios.total,
			items
		}
	}

	async GetCollections(params?: {
		limit?: number
		offset?: number
	}): Promise<List<StoreBookCollection>> {
		let response = await this.apiService.retrieveAuthor(
			`
				collections(limit: $limit, offset: $offset) {
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

		let responseData = response.data.retrieveAuthor
		if (responseData == null) return { total: 0, items: [] }

		let items = []

		for (let item of responseData.collections.items) {
			items.push(
				await StoreBookCollection.Retrieve(
					item.uuid,
					this.dataService,
					this.apiService
				)
			)
		}

		return {
			total: responseData.collections.total,
			items
		}
	}

	async GetSeries(params?: {
		limit?: number
		offset?: number
	}): Promise<List<StoreBookSeries>> {
		// Get the series of the author
		let response = await this.apiService.retrieveAuthor(
			`
				series(limit: $limit, offset: $offset) {
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

		let responseData = response.data.retrieveAuthor
		if (responseData == null) return { total: 0, items: [] }

		let items = []

		for (let item of responseData.series.items) {
			items.push(
				await StoreBookSeries.Retrieve(
					item.uuid,
					this.dataService,
					this.apiService
				)
			)
		}

		return {
			total: responseData.series.total,
			items
		}
	}
}
