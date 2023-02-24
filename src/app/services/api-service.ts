import { Injectable } from "@angular/core"
import axios, { AxiosRequestConfig } from "axios"
import {
	Dav,
	ApiResponse,
	ApiErrorResponse,
	BlobToBase64,
	ConvertErrorToApiErrorResponse,
	HandleApiError,
	PrepareRequestParams
} from "dav-js"
import { CachingService } from "./caching-service"
import { environment } from "src/environments/environment"
import {
	ListResponseData,
	Language,
	PublisherResource,
	PublisherField,
	PublisherListField,
	PublisherLogoResource,
	PublisherLogoField,
	AuthorResource,
	AuthorField,
	AuthorListField,
	AuthorBioResource,
	AuthorBioField,
	AuthorBioListField,
	AuthorProfileImageResource,
	AuthorProfileImageField,
	StoreBookCollectionResource,
	StoreBookCollectionField,
	StoreBookCollectionListField,
	StoreBookCollectionNameResource,
	StoreBookCollectionNameField,
	StoreBookCollectionNameListField,
	StoreBookSeriesResource,
	StoreBookSeriesField,
	StoreBookSeriesListField,
	StoreBookResource,
	StoreBookField,
	StoreBookListField,
	StoreBookCoverResource,
	StoreBookCoverField,
	StoreBookFileResource,
	StoreBookFileField,
	StoreBookReleaseResource,
	StoreBookReleaseField,
	StoreBookReleaseListField,
	CategoryResource,
	CategoryListField,
	BookResource,
	BookField
} from "src/app/misc/types"
import {
	ResponseDataToPublisherResource,
	ResponseDataToPublisherLogoResource,
	ResponseDataToAuthorResource,
	ResponseDataToAuthorBioResource,
	ResponseDataToAuthorProfileImageResource,
	ResponseDataToStoreBookCollectionResource,
	ResponseDataToStoreBookCollectionNameResource,
	ResponseDataToStoreBookSeriesResource,
	ResponseDataToStoreBookResource,
	ResponseDataToStoreBookCoverResource,
	ResponseDataToStoreBookFileResource,
	ResponseDataToStoreBookReleaseResource,
	ResponseDataToCategoryResource,
	ResponseDataToBookResource
} from "src/app/misc/utils"

@Injectable()
export class ApiService {
	constructor(private cachingService: CachingService) {}

	//#region Publisher functions
	async CreatePublisher(params: {
		name: string
		fields?: PublisherField[]
	}): Promise<ApiResponse<PublisherResource> | ApiErrorResponse> {
		try {
			let response = await axios({
				method: "post",
				url: `${environment.pocketlibApiBaseUrl}/publishers`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken,
					"Content-Type": "application/json"
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				),
				data: PrepareRequestParams({
					name: params.name
				})
			})

			return {
				status: response.status,
				data: ResponseDataToPublisherResource(response.data)
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.CreatePublisher(params)
		}
	}

	async RetrievePublisher(params: {
		uuid: string
		fields?: PublisherField[]
	}): Promise<ApiResponse<PublisherResource> | ApiErrorResponse> {
		// Check if the response is cached
		let cacheResponseKey = this.cachingService.GetApiRequestCacheKey(
			this.RetrievePublisher.name,
			PrepareRequestParams(
				{
					uuid: params.uuid,
					fields: params.fields
				},
				true
			)
		)

		// Check if the request is currently running
		let promiseHolder = this.cachingService.GetApiRequest(cacheResponseKey)
		if (promiseHolder != null) await promiseHolder.AwaitResult()

		let cachedResponse =
			this.cachingService.GetApiRequestCacheItem(cacheResponseKey)
		if (cachedResponse) return cachedResponse

		this.cachingService.SetupApiRequest(cacheResponseKey)

		try {
			let response = await axios({
				method: "get",
				url: `${environment.pocketlibApiBaseUrl}/publishers/${params.uuid}`,
				headers: PrepareRequestParams({
					Authorization: params.uuid == "mine" ? Dav.accessToken : null
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				)
			})

			let result = {
				status: response.status,
				data: ResponseDataToPublisherResource(response.data)
			}

			// Add the response to the cache
			this.cachingService.SetApiRequestCacheItem(cacheResponseKey, result)
			this.cachingService.ResolveApiRequest(cacheResponseKey, true)

			return result
		} catch (error) {
			this.cachingService.ResolveApiRequest(cacheResponseKey, false)

			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.RetrievePublisher(params)
		}
	}

	async ListPublishers(params: {
		fields?: PublisherListField[]
	}): Promise<
		ApiResponse<ListResponseData<PublisherResource>> | ApiErrorResponse
	> {
		// Check if the response is cached
		let cacheResponseKey = this.cachingService.GetApiRequestCacheKey(
			this.ListPublishers.name,
			PrepareRequestParams(
				{
					fields: params.fields
				},
				true
			)
		)

		// Check if the request is currently running
		let promiseHolder = this.cachingService.GetApiRequest(cacheResponseKey)
		if (promiseHolder != null) await promiseHolder.AwaitResult()

		let cachedResponse =
			this.cachingService.GetApiRequestCacheItem(cacheResponseKey)
		if (cachedResponse) return cachedResponse

		this.cachingService.SetupApiRequest(cacheResponseKey)

		try {
			let response = await axios({
				method: "get",
				url: `${environment.pocketlibApiBaseUrl}/publishers`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields,
						mine: true
					},
					true
				)
			})

			let result = {
				status: response.status,
				data: {
					type: response.data.type,
					pages: response.data.pages,
					items: []
				}
			}

			for (let item of response.data.items) {
				result.data.items.push(ResponseDataToPublisherResource(item))
			}

			// Add the response to the cache
			this.cachingService.SetApiRequestCacheItem(cacheResponseKey, result)
			this.cachingService.ResolveApiRequest(cacheResponseKey, true)

			return result
		} catch (error) {
			this.cachingService.ResolveApiRequest(cacheResponseKey, false)

			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.ListPublishers(params)
		}
	}

	async UpdatePublisher(params: {
		uuid: string
		name?: string
		description?: string
		websiteUrl?: string
		facebookUsername?: string
		instagramUsername?: string
		twitterUsername?: string
		fields?: PublisherField[]
	}): Promise<ApiResponse<PublisherResource> | ApiErrorResponse> {
		try {
			let response = await axios({
				method: "put",
				url: `${environment.pocketlibApiBaseUrl}/publishers/${params.uuid}`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken,
					"Content-Type": "application/json"
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				),
				data: PrepareRequestParams({
					name: params.name,
					description: params.description,
					website_url: params.websiteUrl,
					facebook_username: params.facebookUsername,
					instagram_username: params.instagramUsername,
					twitter_username: params.twitterUsername
				})
			})

			return {
				status: response.status,
				data: ResponseDataToPublisherResource(response.data)
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.UpdatePublisher(params)
		}
	}
	//#endregion

	//#region PublisherLogo
	async RetrievePublisherLogo(params: {
		uuid: string
		fields?: PublisherLogoField[]
	}): Promise<ApiResponse<PublisherLogoResource> | ApiErrorResponse> {
		// Check if the response is cached
		let cacheResponseKey = this.cachingService.GetApiRequestCacheKey(
			this.RetrievePublisherLogo.name,
			PrepareRequestParams(
				{
					uuid: params.uuid,
					fields: params.fields
				},
				true
			)
		)

		// Check if the request is currently running
		let promiseHolder = this.cachingService.GetApiRequest(cacheResponseKey)
		if (promiseHolder != null) await promiseHolder.AwaitResult()

		let cachedResponse =
			this.cachingService.GetApiRequestCacheItem(cacheResponseKey)
		if (cachedResponse) return cachedResponse

		this.cachingService.SetupApiRequest(cacheResponseKey)

		try {
			let response = await axios({
				method: "get",
				url: `${environment.pocketlibApiBaseUrl}/publishers/${params.uuid}/logo`,
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				)
			})

			let result = {
				status: response.status,
				data: ResponseDataToPublisherLogoResource(response.data)
			}

			// Add the response to the cache
			this.cachingService.SetApiRequestCacheItem(cacheResponseKey, result)
			this.cachingService.ResolveApiRequest(cacheResponseKey, true)

			return result
		} catch (error) {
			this.cachingService.ResolveApiRequest(cacheResponseKey, false)

			return await HandleApiError(error)
		}
	}

	async UploadPublisherLogo(params: {
		uuid: string
		type: string
		file: any
		fields?: PublisherLogoField[]
	}): Promise<ApiResponse<PublisherLogoResource> | ApiErrorResponse> {
		try {
			let response = await axios({
				method: "put",
				url: `${environment.pocketlibApiBaseUrl}/publishers/${params.uuid}/logo`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken,
					"Content-Type": params.type
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				),
				data: params.file
			})

			return {
				status: response.status,
				data: ResponseDataToPublisherLogoResource(response.data)
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.UploadPublisherLogo(params)
		}
	}
	//#endregion

	//#region Author functions
	async CreateAuthor(params: {
		publisher?: string
		firstName: string
		lastName: string
		fields?: AuthorField[]
	}): Promise<ApiResponse<AuthorResource> | ApiErrorResponse> {
		try {
			let response = await axios({
				method: "post",
				url: `${environment.pocketlibApiBaseUrl}/authors`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken,
					"Content-Type": "application/json"
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				),
				data: PrepareRequestParams({
					publisher: params.publisher,
					first_name: params.firstName,
					last_name: params.lastName
				})
			})

			return {
				status: response.status,
				data: ResponseDataToAuthorResource(response.data)
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.CreateAuthor(params)
		}
	}

	async RetrieveAuthor(params: {
		uuid: string
		fields?: AuthorField[]
		languages?: Language[]
	}): Promise<ApiResponse<AuthorResource> | ApiErrorResponse> {
		// Check if the response is cached
		let cacheResponseKey = this.cachingService.GetApiRequestCacheKey(
			this.RetrieveAuthor.name,
			PrepareRequestParams(
				{
					uuid: params.uuid,
					fields: params.fields,
					languages: params.languages
				},
				true
			)
		)

		// Check if the request is currently running
		let promiseHolder = this.cachingService.GetApiRequest(cacheResponseKey)
		if (promiseHolder != null) await promiseHolder.AwaitResult()

		let cachedResponse =
			this.cachingService.GetApiRequestCacheItem(cacheResponseKey)
		if (cachedResponse) return cachedResponse

		this.cachingService.SetupApiRequest(cacheResponseKey)

		try {
			let response = await axios({
				method: "get",
				url: `${environment.pocketlibApiBaseUrl}/authors/${params.uuid}`,
				headers: PrepareRequestParams({
					Authorization: params.uuid == "mine" ? Dav.accessToken : null
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields,
						languages: params.languages
					},
					true
				)
			})

			let result = {
				status: response.status,
				data: ResponseDataToAuthorResource(response.data)
			}

			// Add the response to the cache
			this.cachingService.SetApiRequestCacheItem(cacheResponseKey, result)
			this.cachingService.ResolveApiRequest(cacheResponseKey, true)

			return result
		} catch (error) {
			this.cachingService.ResolveApiRequest(cacheResponseKey, false)

			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.RetrieveAuthor(params)
		}
	}

	async ListAuthors(params: {
		fields?: AuthorListField[]
		languages?: Language[]
		limit?: number
		page?: number
		mine?: boolean
		latest?: boolean
		publisher?: string
	}): Promise<
		ApiResponse<ListResponseData<AuthorResource>> | ApiErrorResponse
	> {
		// Check if the response is cached
		let cacheResponseKey = this.cachingService.GetApiRequestCacheKey(
			this.ListAuthors.name,
			PrepareRequestParams(
				{
					fields: params.fields,
					languages: params.languages,
					limit: params.limit,
					page: params.page,
					mine: params.mine,
					latest: params.latest,
					publisher: params.publisher
				},
				true
			)
		)

		// Check if the request is currently running
		let promiseHolder = this.cachingService.GetApiRequest(cacheResponseKey)
		if (promiseHolder != null) await promiseHolder.AwaitResult()

		let cachedResponse =
			this.cachingService.GetApiRequestCacheItem(cacheResponseKey)
		if (cachedResponse) return cachedResponse

		this.cachingService.SetupApiRequest(cacheResponseKey)

		try {
			let response = await axios({
				method: "get",
				url: `${environment.pocketlibApiBaseUrl}/authors`,
				headers: PrepareRequestParams({
					Authorization:
						params.mine || params.publisher != null
							? Dav.accessToken
							: null
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields,
						languages: params.languages,
						limit: params.limit,
						page: params.page,
						mine: params.mine,
						latest: params.latest,
						publisher: params.publisher
					},
					true
				)
			})

			let result = {
				status: response.status,
				data: {
					type: response.data.type,
					pages: response.data.pages,
					items: []
				}
			}

			for (let item of response.data.items) {
				result.data.items.push(ResponseDataToAuthorResource(item))
			}

			// Add the response to the cache
			this.cachingService.SetApiRequestCacheItem(cacheResponseKey, result)
			this.cachingService.ResolveApiRequest(cacheResponseKey, true)

			return result
		} catch (error) {
			this.cachingService.ResolveApiRequest(cacheResponseKey, false)

			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.ListAuthors(params)
		}
	}

	async UpdateAuthor(params: {
		uuid: string
		firstName?: string
		lastName?: string
		websiteUrl?: string
		facebookUsername?: string
		instagramUsername?: string
		twitterUsername?: string
		fields?: AuthorField[]
		languages?: Language[]
	}): Promise<ApiResponse<AuthorResource> | ApiErrorResponse> {
		try {
			let response = await axios({
				method: "put",
				url: `${environment.pocketlibApiBaseUrl}/authors/${params.uuid}`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken,
					"Content-Type": "application/json"
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields,
						languages: params.languages
					},
					true
				),
				data: PrepareRequestParams({
					first_name: params.firstName,
					last_name: params.lastName,
					website_url: params.websiteUrl,
					facebook_username: params.facebookUsername,
					instagram_username: params.instagramUsername,
					twitter_username: params.twitterUsername
				})
			})

			return {
				status: response.status,
				data: ResponseDataToAuthorResource(response.data)
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.UpdateAuthor(params)
		}
	}
	//#endregion

	//#region AuthorBio
	async ListAuthorBios(params: {
		uuid: string
		fields?: AuthorBioListField[]
	}): Promise<
		ApiResponse<ListResponseData<AuthorBioResource>> | ApiErrorResponse
	> {
		// Check if the response is cached
		let cacheResponseKey = this.cachingService.GetApiRequestCacheKey(
			this.ListAuthorBios.name,
			PrepareRequestParams(
				{
					uuid: params.uuid,
					fields: params.fields
				},
				true
			)
		)

		// Check if the request is currently running
		let promiseHolder = this.cachingService.GetApiRequest(cacheResponseKey)
		if (promiseHolder != null) await promiseHolder.AwaitResult()

		let cachedResponse =
			this.cachingService.GetApiRequestCacheItem(cacheResponseKey)
		if (cachedResponse) return cachedResponse

		this.cachingService.SetupApiRequest(cacheResponseKey)

		try {
			let response = await axios({
				method: "get",
				url: `${environment.pocketlibApiBaseUrl}/authors/${params.uuid}/bios`,
				headers: PrepareRequestParams({
					Authorization: params.uuid == "mine" ? Dav.accessToken : null
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				)
			})

			let result = {
				status: response.status,
				data: {
					type: response.data.type,
					pages: response.data.pages,
					items: []
				}
			}

			for (let item of response.data.items) {
				result.data.items.push(ResponseDataToAuthorBioResource(item))
			}

			// Add the response to the cache
			this.cachingService.SetApiRequestCacheItem(cacheResponseKey, result)
			this.cachingService.ResolveApiRequest(cacheResponseKey, true)

			return result
		} catch (error) {
			this.cachingService.ResolveApiRequest(cacheResponseKey, false)

			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.ListAuthorBios(params)
		}
	}

	async SetAuthorBio(params: {
		uuid: string
		language: string
		bio: string
		fields?: AuthorBioField[]
	}): Promise<ApiResponse<AuthorBioResource> | ApiErrorResponse> {
		try {
			let response = await axios({
				method: "put",
				url: `${environment.pocketlibApiBaseUrl}/authors/${params.uuid}/bios/${params.language}`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken,
					"Content-Type": "application/json"
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				),
				data: PrepareRequestParams({
					bio: params.bio
				})
			})

			return {
				status: response.status,
				data: ResponseDataToAuthorBioResource(response.data)
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.SetAuthorBio(params)
		}
	}
	//#endregion

	//#region AuthorProfileImage
	async RetrieveAuthorProfileImage(params: {
		uuid: string
		fields?: AuthorProfileImageField[]
	}): Promise<ApiResponse<AuthorProfileImageResource> | ApiErrorResponse> {
		// Check if the response is cached
		let cacheResponseKey = this.cachingService.GetApiRequestCacheKey(
			this.RetrieveAuthorProfileImage.name,
			PrepareRequestParams(
				{
					uuid: params.uuid,
					fields: params.fields
				},
				true
			)
		)

		// Check if the request is currently running
		let promiseHolder = this.cachingService.GetApiRequest(cacheResponseKey)
		if (promiseHolder != null) await promiseHolder.AwaitResult()

		let cachedResponse =
			this.cachingService.GetApiRequestCacheItem(cacheResponseKey)
		if (cachedResponse) return cachedResponse

		this.cachingService.SetupApiRequest(cacheResponseKey)

		try {
			let response = await axios({
				method: "get",
				url: `${environment.pocketlibApiBaseUrl}/authors/${params.uuid}/profile_image`,
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				)
			})

			let result = {
				status: response.status,
				data: ResponseDataToAuthorProfileImageResource(response.data)
			}

			// Add the response to the cache
			this.cachingService.SetApiRequestCacheItem(cacheResponseKey, result)
			this.cachingService.ResolveApiRequest(cacheResponseKey, true)

			return result
		} catch (error) {
			this.cachingService.ResolveApiRequest(cacheResponseKey, false)

			return await HandleApiError(error)
		}
	}

	async UploadAuthorProfileImage(params: {
		uuid: string
		type: string
		file: any
		fields?: AuthorProfileImageField[]
	}): Promise<ApiResponse<AuthorProfileImageResource> | ApiErrorResponse> {
		try {
			let response = await axios({
				method: "put",
				url: `${environment.pocketlibApiBaseUrl}/authors/${params.uuid}/profile_image`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken,
					"Content-Type": params.type
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				),
				data: params.file
			})

			return {
				status: response.status,
				data: ResponseDataToAuthorProfileImageResource(response.data)
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.UploadAuthorProfileImage(params)
		}
	}
	//#endregion

	//#region StoreBookCollection
	async CreateStoreBookCollection(params: {
		author?: string
		name: string
		language: string
		fields?: StoreBookCollectionField[]
	}): Promise<ApiResponse<StoreBookCollectionResource> | ApiErrorResponse> {
		try {
			let response = await axios({
				method: "post",
				url: `${environment.pocketlibApiBaseUrl}/store_book_collections`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken,
					"Content-Type": "application/json"
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				),
				data: PrepareRequestParams({
					author: params.author,
					name: params.name,
					language: params.language
				})
			})

			return {
				status: response.status,
				data: ResponseDataToStoreBookCollectionResource(response.data)
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.CreateStoreBookCollection(params)
		}
	}

	async RetrieveStoreBookCollection(params: {
		uuid: string
		fields?: StoreBookCollectionField[]
		languages?: Language[]
	}): Promise<ApiResponse<StoreBookCollectionResource> | ApiErrorResponse> {
		// Check if the response is cached
		let cacheResponseKey = this.cachingService.GetApiRequestCacheKey(
			this.RetrieveStoreBookCollection.name,
			PrepareRequestParams(
				{
					uuid: params.uuid,
					fields: params.fields,
					languages: params.languages
				},
				true
			)
		)

		// Check if the request is currently running
		let promiseHolder = this.cachingService.GetApiRequest(cacheResponseKey)
		if (promiseHolder != null) await promiseHolder.AwaitResult()

		let cachedResponse =
			this.cachingService.GetApiRequestCacheItem(cacheResponseKey)
		if (cachedResponse) return cachedResponse

		this.cachingService.SetupApiRequest(cacheResponseKey)

		try {
			let response = await axios({
				method: "get",
				url: `${environment.pocketlibApiBaseUrl}/store_book_collections/${params.uuid}`,
				params: PrepareRequestParams(
					{
						fields: params.fields,
						languages: params.languages
					},
					true
				)
			})

			let result = {
				status: response.status,
				data: ResponseDataToStoreBookCollectionResource(response.data)
			}

			// Add the response to the cache
			this.cachingService.SetApiRequestCacheItem(cacheResponseKey, result)
			this.cachingService.ResolveApiRequest(cacheResponseKey, true)

			return result
		} catch (error) {
			this.cachingService.ResolveApiRequest(cacheResponseKey, false)

			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.RetrieveStoreBookCollection(params)
		}
	}

	async ListStoreBookCollections(params: {
		author?: string
		fields?: StoreBookCollectionListField[]
		languages?: Language[]
	}): Promise<
		| ApiResponse<ListResponseData<StoreBookCollectionResource>>
		| ApiErrorResponse
	> {
		// Check if the response is cached
		let cacheResponseKey = this.cachingService.GetApiRequestCacheKey(
			this.ListStoreBookCollections.name,
			PrepareRequestParams(
				{
					author: params.author,
					fields: params.fields,
					languages: params.languages
				},
				true
			)
		)

		// Check if the request is currently running
		let promiseHolder = this.cachingService.GetApiRequest(cacheResponseKey)
		if (promiseHolder != null) await promiseHolder.AwaitResult()

		let cachedResponse =
			this.cachingService.GetApiRequestCacheItem(cacheResponseKey)
		if (cachedResponse) return cachedResponse

		this.cachingService.SetupApiRequest(cacheResponseKey)

		try {
			let response = await axios({
				method: "get",
				url: `${environment.pocketlibApiBaseUrl}/store_book_collections`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken
				}),
				params: PrepareRequestParams(
					{
						author: params.author,
						fields: params.fields,
						languages: params.languages
					},
					true
				)
			})

			let result = {
				status: response.status,
				data: {
					type: response.data.type,
					pages: response.data.pages,
					items: []
				}
			}

			for (let item of response.data.items) {
				result.data.items.push(
					ResponseDataToStoreBookCollectionResource(item)
				)
			}

			// Add the response to the cache
			this.cachingService.SetApiRequestCacheItem(cacheResponseKey, result)
			this.cachingService.ResolveApiRequest(cacheResponseKey, true)

			return result
		} catch (error) {
			this.cachingService.ResolveApiRequest(cacheResponseKey, false)

			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.ListStoreBookCollections(params)
		}
	}
	//#endregion

	//#region StoreBookCollectionName
	async ListStoreBookCollectionNames(params: {
		uuid: string
		fields?: StoreBookCollectionNameListField[]
	}): Promise<
		| ApiResponse<ListResponseData<StoreBookCollectionNameResource>>
		| ApiErrorResponse
	> {
		// Check if the response is cached
		let cacheResponseKey = this.cachingService.GetApiRequestCacheKey(
			this.ListStoreBookCollectionNames.name,
			PrepareRequestParams(
				{
					uuid: params.uuid,
					fields: params.fields
				},
				true
			)
		)

		// Check if the request is currently running
		let promiseHolder = this.cachingService.GetApiRequest(cacheResponseKey)
		if (promiseHolder != null) await promiseHolder.AwaitResult()

		let cachedResponse =
			this.cachingService.GetApiRequestCacheItem(cacheResponseKey)
		if (cachedResponse) return cachedResponse

		this.cachingService.SetupApiRequest(cacheResponseKey)

		try {
			let response = await axios({
				method: "get",
				url: `${environment.pocketlibApiBaseUrl}/store_book_collections/${params.uuid}/names`,
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				)
			})

			let result = {
				status: response.status,
				data: {
					type: response.data.type,
					pages: response.data.pages,
					items: []
				}
			}

			for (let item of response.data.items) {
				result.data.items.push(
					ResponseDataToStoreBookCollectionNameResource(item)
				)
			}

			// Add the response to the cache
			this.cachingService.SetApiRequestCacheItem(cacheResponseKey, result)
			this.cachingService.ResolveApiRequest(cacheResponseKey, true)

			return result
		} catch (error) {
			this.cachingService.ResolveApiRequest(cacheResponseKey, false)
			return await HandleApiError(error)
		}
	}

	async SetStoreBookCollectionName(params: {
		uuid: string
		name: string
		language: string
		fields?: StoreBookCollectionNameField[]
	}): Promise<
		ApiResponse<StoreBookCollectionNameResource> | ApiErrorResponse
	> {
		try {
			let response = await axios({
				method: "put",
				url: `${environment.pocketlibApiBaseUrl}/store_book_collections/${params.uuid}/names/${params.language}`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken,
					"Content-Type": "application/json"
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				),
				data: PrepareRequestParams({
					name: params.name
				})
			})

			return {
				status: response.status,
				data: ResponseDataToStoreBookCollectionNameResource(response.data)
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.SetStoreBookCollectionName(params)
		}
	}
	//#endregion

	//#region StoreBookSeries
	async CreateStoreBookSeries(params: {
		author?: string
		name: string
		language: string
		storeBooks?: string[]
		fields?: StoreBookSeriesField[]
	}): Promise<ApiResponse<StoreBookSeriesResource> | ApiErrorResponse> {
		try {
			let response = await axios({
				method: "post",
				url: `${environment.pocketlibApiBaseUrl}/store_book_series`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken,
					"Content-Type": "application/json"
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				),
				data: PrepareRequestParams({
					author: params.author,
					name: params.name,
					language: params.language,
					store_books: params.storeBooks
				})
			})

			return {
				status: response.status,
				data: ResponseDataToStoreBookSeriesResource(response.data)
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.CreateStoreBookSeries(params)
		}
	}

	async RetrieveStoreBookSeries(params: {
		uuid: string
		fields?: StoreBookSeriesField[]
	}): Promise<ApiResponse<StoreBookSeriesResource> | ApiErrorResponse> {
		// Check if the response is cached
		let cacheResponseKey = this.cachingService.GetApiRequestCacheKey(
			this.RetrieveStoreBookSeries.name,
			PrepareRequestParams(
				{
					uuid: params.uuid,
					fields: params.fields
				},
				true
			)
		)

		// Check if the request is currently running
		let promiseHolder = this.cachingService.GetApiRequest(cacheResponseKey)
		if (promiseHolder != null) await promiseHolder.AwaitResult()

		let cachedResponse =
			this.cachingService.GetApiRequestCacheItem(cacheResponseKey)
		if (cachedResponse) return cachedResponse

		this.cachingService.SetupApiRequest(cacheResponseKey)

		try {
			let response = await axios({
				method: "get",
				url: `${environment.pocketlibApiBaseUrl}/store_book_series/${params.uuid}`,
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				)
			})

			let result = {
				status: response.status,
				data: ResponseDataToStoreBookSeriesResource(response.data)
			}

			// Add the response to the cache
			this.cachingService.SetApiRequestCacheItem(cacheResponseKey, result)
			this.cachingService.ResolveApiRequest(cacheResponseKey, true)

			return result
		} catch (error) {
			this.cachingService.ResolveApiRequest(cacheResponseKey, false)

			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.RetrieveStoreBookSeries(params)
		}
	}

	async ListStoreBookSeries(params: {
		fields?: StoreBookSeriesListField[]
		languages?: Language[]
		limit?: number
		latest?: boolean
		author?: string
		storeBook?: string
	}): Promise<
		ApiResponse<ListResponseData<StoreBookSeriesResource>> | ApiErrorResponse
	> {
		// Check if the response is cached
		let cacheResponseKey = this.cachingService.GetApiRequestCacheKey(
			this.ListStoreBookSeries.name,
			PrepareRequestParams(
				{
					fields: params.fields,
					languages: params.languages,
					limit: params.limit,
					latest: params.latest,
					author: params.author,
					storeBook: params.storeBook
				},
				true
			)
		)

		// Check if the request is currently running
		let promiseHolder = this.cachingService.GetApiRequest(cacheResponseKey)
		if (promiseHolder != null) await promiseHolder.AwaitResult()

		let cachedResponse =
			this.cachingService.GetApiRequestCacheItem(cacheResponseKey)
		if (cachedResponse) return cachedResponse

		this.cachingService.SetupApiRequest(cacheResponseKey)

		try {
			let response = await axios({
				method: "get",
				url: `${environment.pocketlibApiBaseUrl}/store_book_series`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields,
						languages: params.languages,
						limit: params.limit,
						latest: params.latest,
						author: params.author,
						store_book: params.storeBook
					},
					true
				)
			})

			let result = {
				status: response.status,
				data: {
					type: response.data.type,
					pages: response.data.pages,
					items: []
				}
			}

			for (let item of response.data.items) {
				result.data.items.push(ResponseDataToStoreBookSeriesResource(item))
			}

			// Add the response to the cache
			this.cachingService.SetApiRequestCacheItem(cacheResponseKey, result)
			this.cachingService.ResolveApiRequest(cacheResponseKey, true)

			return result
		} catch (error) {
			this.cachingService.ResolveApiRequest(cacheResponseKey, false)

			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.ListStoreBookSeries(params)
		}
	}

	async UpdateStoreBookSeries(params: {
		uuid: string
		name?: string
		storeBooks?: string[]
		fields?: StoreBookSeriesField[]
		languages?: Language[]
	}): Promise<ApiResponse<StoreBookSeriesResource> | ApiErrorResponse> {
		try {
			let response = await axios({
				method: "put",
				url: `${environment.pocketlibApiBaseUrl}/store_book_series/${params.uuid}`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken,
					"Content-Type": "application/json"
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields,
						languages: params.languages
					},
					true
				),
				data: PrepareRequestParams({
					name: params.name,
					store_books: params.storeBooks
				})
			})

			return {
				status: response.status,
				data: ResponseDataToStoreBookSeriesResource(response.data)
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.UpdateStoreBookSeries(params)
		}
	}
	//#endregion

	//#region StoreBook
	async CreateStoreBook(params: {
		author?: string
		collection?: string
		title: string
		description?: string
		language: string
		price?: number
		isbn?: string
		categories?: string[]
		fields?: StoreBookField[]
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		try {
			let response = await axios({
				method: "post",
				url: `${environment.pocketlibApiBaseUrl}/store_books`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken,
					"Content-Type": "application/json"
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				),
				data: PrepareRequestParams({
					author: params.author,
					collection: params.collection,
					title: params.title,
					description: params.description,
					language: params.language,
					price: params.price,
					isbn: params.isbn,
					categories: params.categories
				})
			})

			return {
				status: response.status,
				data: ResponseDataToStoreBookResource(response.data)
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.CreateStoreBook(params)
		}
	}

	async RetrieveStoreBook(params: {
		uuid: string
		fields?: StoreBookField[]
	}): Promise<ApiResponse<StoreBookResource> | ApiErrorResponse> {
		// Check if the response is cached
		let cacheResponseKey = this.cachingService.GetApiRequestCacheKey(
			this.RetrieveStoreBook.name,
			PrepareRequestParams(
				{
					uuid: params.uuid,
					fields: params.fields
				},
				true
			)
		)

		// Check if the request is currently running
		let promiseHolder = this.cachingService.GetApiRequest(cacheResponseKey)
		if (promiseHolder != null) await promiseHolder.AwaitResult()

		let cachedResponse =
			this.cachingService.GetApiRequestCacheItem(cacheResponseKey)
		if (cachedResponse) return cachedResponse

		this.cachingService.SetupApiRequest(cacheResponseKey)

		try {
			let response = await axios({
				method: "get",
				url: `${environment.pocketlibApiBaseUrl}/store_books/${params.uuid}`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				)
			})

			let result = {
				status: response.status,
				data: ResponseDataToStoreBookResource(response.data)
			}

			// Add the response to the cache
			this.cachingService.SetApiRequestCacheItem(cacheResponseKey, result)
			this.cachingService.ResolveApiRequest(cacheResponseKey, true)

			return result
		} catch (error) {
			this.cachingService.ResolveApiRequest(cacheResponseKey, false)

			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.RetrieveStoreBook(params)
		}
	}

	async ListStoreBooks(params: {
		fields?: StoreBookListField[]
		languages?: Language[]
		limit?: number
		page?: number
		latest?: boolean
		review?: boolean
		author?: string
		collection?: string
		series?: string
		categories?: string[]
	}): Promise<
		ApiResponse<ListResponseData<StoreBookResource>> | ApiErrorResponse
	> {
		// Check if the response is cached
		let cacheResponseKey = this.cachingService.GetApiRequestCacheKey(
			this.ListStoreBooks.name,
			PrepareRequestParams(
				{
					fields: params.fields,
					languages: params.languages,
					limit: params.limit,
					page: params.page,
					latest: params.latest,
					review: params.review,
					author: params.author,
					collection: params.collection,
					series: params.series,
					categories: params.categories
				},
				true
			)
		)

		// Check if the request is currently running
		let promiseHolder = this.cachingService.GetApiRequest(cacheResponseKey)
		if (promiseHolder != null) await promiseHolder.AwaitResult()

		let cachedResponse =
			this.cachingService.GetApiRequestCacheItem(cacheResponseKey)
		if (cachedResponse) return cachedResponse

		this.cachingService.SetupApiRequest(cacheResponseKey)

		try {
			let requestConfig: AxiosRequestConfig = {
				method: "get",
				url: `${environment.pocketlibApiBaseUrl}/store_books`,
				params: PrepareRequestParams(
					{
						fields: params.fields,
						languages: params.languages,
						limit: params.limit,
						page: params.page,
						latest: params.latest,
						review: params.review,
						author: params.author,
						collection: params.collection,
						series: params.series,
						categories: params.categories
					},
					true
				)
			}

			if (
				Dav.accessToken != null &&
				(params.review ||
					(params.fields != null &&
						(params.fields.includes(StoreBookListField.items_file) ||
							params.fields.includes(
								StoreBookListField.items_file_fileName
							) ||
							params.fields.includes(
								StoreBookListField.items_inLibrary
							) ||
							params.fields.includes(
								StoreBookListField.items_purchased
							))))
			) {
				requestConfig.headers = PrepareRequestParams({
					Authorization: Dav.accessToken
				})
			}

			let response = await axios(requestConfig)

			let result = {
				status: response.status,
				data: {
					type: response.data.type,
					pages: response.data.pages,
					items: []
				}
			}

			for (let item of response.data.items) {
				result.data.items.push(ResponseDataToStoreBookResource(item))
			}

			// Add the response to the cache
			this.cachingService.SetApiRequestCacheItem(cacheResponseKey, result)
			this.cachingService.ResolveApiRequest(cacheResponseKey, true)

			return result
		} catch (error) {
			this.cachingService.ResolveApiRequest(cacheResponseKey, false)

			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.ListStoreBooks(params)
		}
	}

	async UpdateStoreBook(params: {
		uuid: string
		title?: string
		description?: string
		language?: string
		price?: number
		isbn?: string
		status?: string
		categories?: string[]
		fields?: StoreBookField[]
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		try {
			let response = await axios({
				method: "put",
				url: `${environment.pocketlibApiBaseUrl}/store_books/${params.uuid}`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken,
					"Content-Type": "application/json"
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				),
				data: PrepareRequestParams({
					title: params.title,
					description: params.description,
					language: params.language,
					price: params.price,
					isbn: params.isbn,
					status: params.status,
					categories: params.categories
				})
			})

			return {
				status: response.status,
				data: ResponseDataToStoreBookResource(response.data)
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.UpdateStoreBook(params)
		}
	}
	//#endregion

	//#region StoreBookCover
	async RetrieveStoreBookCover(params: {
		uuid: string
		fields?: StoreBookCoverField[]
	}): Promise<ApiResponse<StoreBookCoverResource> | ApiErrorResponse> {
		// Check if the response is cached
		let cacheResponseKey = this.cachingService.GetApiRequestCacheKey(
			this.RetrieveStoreBookCover.name,
			PrepareRequestParams(
				{
					uuid: params.uuid,
					fields: params.fields
				},
				true
			)
		)

		// Check if the request is currently running
		let promiseHolder = this.cachingService.GetApiRequest(cacheResponseKey)
		if (promiseHolder != null) await promiseHolder.AwaitResult()

		let cachedResponse =
			this.cachingService.GetApiRequestCacheItem(cacheResponseKey)
		if (cachedResponse) return cachedResponse

		this.cachingService.SetupApiRequest(cacheResponseKey)

		try {
			let response = await axios({
				method: "get",
				url: `${environment.pocketlibApiBaseUrl}/store_books/${params.uuid}/cover`,
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				)
			})

			let result = {
				status: response.status,
				data: ResponseDataToStoreBookCoverResource(response.data)
			}

			// Add the response to the cache
			this.cachingService.SetApiRequestCacheItem(cacheResponseKey, result)
			this.cachingService.ResolveApiRequest(cacheResponseKey, true)

			return result
		} catch (error) {
			this.cachingService.ResolveApiRequest(cacheResponseKey, false)

			return await HandleApiError(error)
		}
	}

	async UploadStoreBookCover(params: {
		uuid: string
		type: string
		file: any
		fields?: StoreBookCoverField[]
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		try {
			let response = await axios({
				method: "put",
				url: `${environment.pocketlibApiBaseUrl}/store_books/${params.uuid}/cover`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken,
					"Content-Type": params.type
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				),
				data: params.file
			})

			return {
				status: response.status,
				data: ResponseDataToStoreBookCoverResource(response.data)
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.UploadStoreBookCover(params)
		}
	}
	//#endregion

	//#region StoreBookFile
	async RetrieveStoreBookFile(params: {
		uuid: string
		fields?: StoreBookFileField[]
	}): Promise<ApiResponse<StoreBookFileResource> | ApiErrorResponse> {
		// Check if the response is cached
		let cacheResponseKey = this.cachingService.GetApiRequestCacheKey(
			this.RetrieveStoreBookFile.name,
			PrepareRequestParams(
				{
					uuid: params.uuid,
					fields: params.fields
				},
				true
			)
		)

		// Check if the request is currently running
		let promiseHolder = this.cachingService.GetApiRequest(cacheResponseKey)
		if (promiseHolder != null) await promiseHolder.AwaitResult()

		let cachedResponse =
			this.cachingService.GetApiRequestCacheItem(cacheResponseKey)
		if (cachedResponse) return cachedResponse

		this.cachingService.SetupApiRequest(cacheResponseKey)

		try {
			let response = await axios({
				method: "get",
				url: `${environment.pocketlibApiBaseUrl}/store_books/${params.uuid}/file`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				)
			})

			let result = {
				status: response.status,
				data: ResponseDataToStoreBookFileResource(response.data)
			}

			// Add the response to the cache
			this.cachingService.SetApiRequestCacheItem(cacheResponseKey, result)
			this.cachingService.ResolveApiRequest(cacheResponseKey, true)

			return result
		} catch (error) {
			this.cachingService.ResolveApiRequest(cacheResponseKey, false)

			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.RetrieveStoreBookFile(params)
		}
	}

	async UploadStoreBookFile(params: {
		uuid: string
		type: string
		name: string
		file: any
		fields?: StoreBookFileField[]
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		try {
			let response = await axios({
				method: "put",
				url: `${environment.pocketlibApiBaseUrl}/store_books/${params.uuid}/file`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken,
					"Content-Type": params.type,
					"Content-Disposition": `attachment; filename="${encodeURIComponent(
						params.name
					)}"`
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				),
				data: params.file
			})

			return {
				status: response.status,
				data: ResponseDataToStoreBookFileResource(response.data)
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.UploadStoreBookFile(params)
		}
	}
	//#endregion

	//#region StoreBookRelease
	async RetrieveStoreBookRelease(params: {
		uuid: string
		fields?: StoreBookReleaseField[]
	}): Promise<ApiResponse<StoreBookReleaseResource> | ApiErrorResponse> {
		// Check if the response is cached
		let cacheResponseKey = this.cachingService.GetApiRequestCacheKey(
			this.RetrieveStoreBookRelease.name,
			PrepareRequestParams(
				{
					uuid: params.uuid,
					fields: params.fields
				},
				true
			)
		)

		// Check if the request is currently running
		let promiseHolder = this.cachingService.GetApiRequest(cacheResponseKey)
		if (promiseHolder != null) await promiseHolder.AwaitResult()

		let cachedResponse =
			this.cachingService.GetApiRequestCacheItem(cacheResponseKey)
		if (cachedResponse) return cachedResponse

		this.cachingService.SetupApiRequest(cacheResponseKey)

		try {
			let response = await axios({
				method: "get",
				url: `${environment.pocketlibApiBaseUrl}/store_book_releases/${params.uuid}`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				)
			})

			let result = {
				status: response.status,
				data: ResponseDataToStoreBookReleaseResource(response.data)
			}

			// Add the response to the cache
			this.cachingService.SetApiRequestCacheItem(cacheResponseKey, result)
			this.cachingService.ResolveApiRequest(cacheResponseKey, true)

			return result
		} catch (error) {
			this.cachingService.ResolveApiRequest(cacheResponseKey, false)

			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.RetrieveStoreBookRelease(params)
		}
	}

	async ListStoreBookReleases(params: {
		storeBook: string
		fields?: StoreBookReleaseListField[]
	}): Promise<
		ApiResponse<ListResponseData<StoreBookReleaseResource>> | ApiErrorResponse
	> {
		// Check if the response is cached
		let cacheResponseKey = this.cachingService.GetApiRequestCacheKey(
			this.ListStoreBookReleases.name,
			PrepareRequestParams(
				{
					storeBook: params.storeBook,
					fields: params.fields
				},
				true
			)
		)

		// Check if the request is currently running
		let promiseHolder = this.cachingService.GetApiRequest(cacheResponseKey)
		if (promiseHolder != null) await promiseHolder.AwaitResult()

		let cachedResponse =
			this.cachingService.GetApiRequestCacheItem(cacheResponseKey)
		if (cachedResponse) return cachedResponse

		this.cachingService.SetupApiRequest(cacheResponseKey)

		try {
			let response = await axios({
				method: "get",
				url: `${environment.pocketlibApiBaseUrl}/store_book_releases`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken
				}),
				params: PrepareRequestParams(
					{
						store_book: params.storeBook,
						fields: params.fields
					},
					true
				)
			})

			let result = {
				status: response.status,
				data: {
					type: response.data.type,
					pages: response.data.pages,
					items: []
				}
			}

			for (let item of response.data.items) {
				result.data.items.push(ResponseDataToStoreBookReleaseResource(item))
			}

			// Add the response to the cache
			this.cachingService.SetApiRequestCacheItem(cacheResponseKey, result)
			this.cachingService.ResolveApiRequest(cacheResponseKey, true)

			return result
		} catch (error) {
			this.cachingService.ResolveApiRequest(cacheResponseKey, false)

			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.ListStoreBookReleases(params)
		}
	}

	async PublishStoreBookRelease(params: {
		uuid: string
		releaseName: string
		releaseNotes?: string
		fields?: StoreBookReleaseField[]
	}): Promise<ApiResponse<StoreBookReleaseResource> | ApiErrorResponse> {
		try {
			let response = await axios({
				method: "put",
				url: `${environment.pocketlibApiBaseUrl}/store_book_releases/${params.uuid}/publish`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken,
					"Content-Type": "application/json"
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				),
				data: PrepareRequestParams({
					release_name: params.releaseName,
					release_notes: params.releaseNotes
				})
			})

			return {
				status: response.status,
				data: ResponseDataToStoreBookReleaseResource(response.data)
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.PublishStoreBookRelease(params)
		}
	}
	//#endregion

	//#region Category
	async ListCategories(params: {
		fields?: CategoryListField[]
		languages?: Language[]
	}): Promise<
		ApiResponse<ListResponseData<CategoryResource>> | ApiErrorResponse
	> {
		// Check if the response is cached
		let cacheResponseKey = this.cachingService.GetApiRequestCacheKey(
			this.ListCategories.name,
			PrepareRequestParams(
				{
					fields: params.fields,
					languages: params.languages
				},
				true
			)
		)

		// Check if the request is currently running
		let promiseHolder = this.cachingService.GetApiRequest(cacheResponseKey)
		if (promiseHolder != null) await promiseHolder.AwaitResult()

		let cachedResponse =
			this.cachingService.GetApiRequestCacheItem(cacheResponseKey)
		if (cachedResponse) return cachedResponse

		this.cachingService.SetupApiRequest(cacheResponseKey)

		try {
			let response = await axios({
				method: "get",
				url: `${environment.pocketlibApiBaseUrl}/categories`,
				params: PrepareRequestParams(
					{
						fields: params.fields,
						languages: params.languages
					},
					true
				)
			})

			let result = {
				status: response.status,
				data: {
					type: response.data.type,
					pages: response.data.pages,
					items: []
				}
			}

			for (let item of response.data.items) {
				result.data.items.push(ResponseDataToCategoryResource(item))
			}

			// Add the response to the cache
			this.cachingService.SetApiRequestCacheItem(cacheResponseKey, result)
			this.cachingService.ResolveApiRequest(cacheResponseKey, true)

			return result
		} catch (error) {
			this.cachingService.ResolveApiRequest(cacheResponseKey, false)
			return ConvertErrorToApiErrorResponse(error)
		}
	}
	//#endregion

	//#region Book
	async CreateBook(params: {
		storeBook: string
		fields?: BookField[]
	}): Promise<ApiResponse<BookResource> | ApiErrorResponse> {
		try {
			let response = await axios({
				method: "post",
				url: `${environment.pocketlibApiBaseUrl}/books`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken,
					"Content-Type": "application/json"
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				),
				data: PrepareRequestParams({
					store_book: params.storeBook
				})
			})

			return {
				status: response.status,
				data: ResponseDataToBookResource(response.data)
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.CreateBook(params)
		}
	}
	//#endregion

	//#region Other functions
	async GetFile(params: {
		url: string
	}): Promise<ApiResponse<string> | ApiErrorResponse> {
		// Check if the response is cached
		let cacheResponseKey = this.cachingService.GetApiRequestCacheKey(
			this.GetFile.name,
			{
				url: params.url
			}
		)

		// Check if the request is currently running
		let promiseHolder = this.cachingService.GetApiRequest(cacheResponseKey)
		if (promiseHolder != null) await promiseHolder.AwaitResult()

		let cachedResponse =
			this.cachingService.GetApiRequestCacheItem(cacheResponseKey)
		if (cachedResponse) return cachedResponse

		this.cachingService.SetupApiRequest(cacheResponseKey)

		try {
			let response = await axios({
				method: "get",
				url: params.url,
				responseType: "blob"
			})

			let result = {
				status: response.status,
				data: null
			}

			if (response.data.size > 0) {
				result.data = await BlobToBase64(response.data)
			}

			// Add the response to the cache
			this.cachingService.SetApiRequestCacheItem(cacheResponseKey, result)
			this.cachingService.ResolveApiRequest(cacheResponseKey, true)

			return result
		} catch (error) {
			this.cachingService.ResolveApiRequest(cacheResponseKey, false)
			return ConvertErrorToApiErrorResponse(error)
		}
	}
	//#endregion
}
