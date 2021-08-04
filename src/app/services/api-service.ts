import { Injectable } from '@angular/core'
import * as axios from 'axios'
import {
	Dav,
	ApiResponse,
	ApiErrorResponse,
	BlobToBase64,
	ConvertErrorToApiErrorResponse,
	HandleApiError
} from 'dav-js'
import { environment } from 'src/environments/environment'
import { Author } from 'src/app/misc/types'
import { GetBookStatusByString } from 'src/app/misc/utils'

@Injectable()
export class ApiService {
	apiRequestCache: {
		[key: string]: ApiResponse<any>
	} = {}

	//#region Author functions
	async CreateAuthor(params: {
		firstName: string,
		lastName: string
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		try {
			let data = {}
			if (params.firstName != null) data["first_name"] = params.firstName
			if (params.lastName != null) data["last_name"] = params.lastName

			let response = await axios.default({
				method: 'post',
				url: `${environment.pocketlibApiBaseUrl}/author`,
				headers: {
					Authorization: Dav.accessToken,
					'Content-Type': 'application/json'
				},
				data
			})

			return {
				status: response.status,
				data: response.data
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.CreateAuthor(params)
		}
	}

	async GetAuthorOfUser(): Promise<ApiResponse<any> | ApiErrorResponse> {
		try {
			let response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/author`,
				headers: {
					Authorization: Dav.accessToken
				}
			})

			return {
				status: response.status,
				data: response.data
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.GetAuthorOfUser()
		}
	}

	async GetAuthor(params: {
		uuid: string,
		books?: boolean,
		languages?: string[]
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		let uuid = params.uuid
		let books = params.books != null ? params.books : true
		let languages = params.languages != null ? params.languages.join(',') : "en"

		// Check if the response is cached
		let cacheResponseKey = this.GetApiRequestCacheKey(this.GetAuthor.name, {
			uuid,
			books,
			languages
		})
		let cachedResponse = this.apiRequestCache[cacheResponseKey]
		if (cachedResponse) return cachedResponse

		try {
			let response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/author/${uuid}`,
				params: {
					books,
					languages
				}
			})

			let result = {
				status: response.status,
				data: response.data
			}

			// Add the response to the cache
			this.apiRequestCache[cacheResponseKey] = result
			return result
		} catch (error) {
			return ConvertErrorToApiErrorResponse(error)
		}
	}

	async GetLatestAuthors(): Promise<ApiResponse<any> | ApiErrorResponse> {
		// Check if the response is cached
		let cacheResponseKey = this.GetApiRequestCacheKey(this.GetLatestAuthors.name, {})
		let cachedResponse = this.apiRequestCache[cacheResponseKey]
		if (cachedResponse) return cachedResponse

		try {
			var response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/authors/latest`
			})

			let result = {
				status: response.status,
				data: response.data
			}

			// Add the response to the cache
			this.apiRequestCache[cacheResponseKey] = result
			return result
		} catch (error) {
			return ConvertErrorToApiErrorResponse(error)
		}
	}

	async UpdateAuthorOfUser(params: {
		firstName?: string,
		lastName?: string,
		websiteUrl?: string,
		facebookUsername?: string,
		instagramUsername?: string,
		twitterUsername?: string
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		try {
			let data = {}
			if (params.firstName != null) data["first_name"] = params.firstName
			if (params.lastName != null) data["last_name"] = params.lastName
			if (params.websiteUrl != null) data["website_url"] = params.websiteUrl
			if (params.facebookUsername != null) data["facebook_username"] = params.facebookUsername
			if (params.instagramUsername != null) data["instagram_username"] = params.instagramUsername
			if (params.twitterUsername != null) data["twitter_username"] = params.twitterUsername

			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/author`,
				headers: {
					Authorization: Dav.accessToken,
					'Content-Type': 'application/json'
				},
				data
			})

			return {
				status: response.status,
				data: response.data
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.UpdateAuthorOfUser(params)
		}
	}

	async UpdateAuthor(params: {
		uuid: string,
		firstName?: string,
		lastName?: string,
		websiteUrl?: string,
		facebookUsername?: string,
		instagramUsername?: string,
		twitterUsername?: string
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		try {
			let data = {}
			if (params.firstName != null) data["first_name"] = params.firstName
			if (params.lastName != null) data["last_name"] = params.lastName
			if (params.websiteUrl != null) data["website_url"] = params.websiteUrl
			if (params.facebookUsername != null) data["facebook_username"] = params.facebookUsername
			if (params.instagramUsername != null) data["instagram_username"] = params.instagramUsername
			if (params.twitterUsername != null) data["twitter_username"] = params.twitterUsername

			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/author/${params.uuid}`,
				headers: {
					Authorization: Dav.accessToken,
					'Content-Type': 'application/json'
				},
				data
			})

			return {
				status: response.status,
				data: response.data
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.UpdateAuthor(params)
		}
	}
	//#endregion

	//#region AuthorBio
	async SetBioOfAuthorOfUser(params: {
		language: string,
		bio: string
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		try {
			let data = {}
			if (params.bio != null) data["bio"] = params.bio

			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/author/bio/${params.language}`,
				headers: {
					Authorization: Dav.accessToken,
					'Content-Type': 'application/json'
				},
				data
			})

			return {
				status: response.status,
				data: response.data
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.SetBioOfAuthorOfUser(params)
		}
	}

	async SetBioOfAuthor(params: {
		uuid: string,
		language: string,
		bio: string
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		try {
			let data = {}
			if (params.bio != null) data["bio"] = params.bio

			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/author/${params.uuid}/bio/${params.language}`,
				headers: {
					Authorization: Dav.accessToken,
					'Content-Type': 'application/json'
				},
				data
			})

			return {
				status: response.status,
				data: response.data
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.SetBioOfAuthor(params)
		}
	}
	//#endregion

	//#region AuthorProfileImage
	async SetProfileImageOfAuthorOfUser(params: {
		type: string,
		file: any
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		try {
			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/author/profile_image`,
				headers: {
					Authorization: Dav.accessToken,
					'Content-Type': params.type
				},
				data: params.file
			})

			return {
				status: response.status,
				data: response.data
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.SetProfileImageOfAuthorOfUser(params)
		}
	}

	async SetProfileImageOfAuthor(params: {
		uuid: string,
		type: string,
		file: any
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		try {
			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/author/${params.uuid}/profile_image`,
				headers: {
					Authorization: Dav.accessToken,
					'Content-Type': params.type
				},
				data: params.file
			})

			return {
				status: response.status,
				data: response.data
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.SetProfileImageOfAuthor(params)
		}
	}

	async GetProfileImageOfAuthor(params: {
		uuid: string
	}): Promise<ApiResponse<string> | ApiErrorResponse> {
		let uuid = params.uuid

		// Check if the response is cached
		let cacheResponseKey = this.GetApiRequestCacheKey(this.GetProfileImageOfAuthor.name, {
			uuid
		})
		let cachedResponse = this.apiRequestCache[cacheResponseKey]
		if (cachedResponse) return cachedResponse

		try {
			let response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/author/${uuid}/profile_image`,
				responseType: 'blob'
			})

			let result = {
				status: response.status,
				data: null
			}

			if (response.data.size > 0) result.data = await BlobToBase64(response.data)

			// Add the response to the cache
			this.apiRequestCache[cacheResponseKey] = result
			return result
		} catch (error) {
			return ConvertErrorToApiErrorResponse(error)
		}
	}
	//#endregion

	//#region StoreBookCollection
	async CreateStoreBookCollection(params: {
		author?: string,
		name: string,
		language: string
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		try {
			let data = {}
			if (params.name != null) data["name"] = params.name
			if (params.language != null) data["language"] = params.language
			if (params.author != null) data["author"] = params.author

			let response = await axios.default({
				method: 'post',
				url: `${environment.pocketlibApiBaseUrl}/store/collection`,
				headers: {
					Authorization: Dav.accessToken,
					'Content-Type': 'application/json'
				},
				data
			})

			return {
				status: response.status,
				data: response.data
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.CreateStoreBookCollection(params)
		}
	}

	async GetStoreBookCollection(params: {
		uuid: string
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		let uuid = params.uuid

		// Check if the response is cached
		let cachedResponseKey = this.GetApiRequestCacheKey(this.GetStoreBookCollection.name, {
			uuid
		})
		let cachedResponse = this.apiRequestCache[cachedResponseKey]
		if (cachedResponse) return cachedResponse

		try {
			let options: axios.AxiosRequestConfig = {
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/store/collection/${uuid}`
			}

			if (Dav.accessToken != null) {
				options.headers = {
					Authorization: Dav.accessToken
				}
			}

			let response = await axios.default(options)

			let result = {
				status: response.status,
				data: response.data
			}

			// Add the response to the cache
			this.apiRequestCache[cachedResponseKey] = result
			return result
		} catch (error) {
			if (Dav.accessToken == null) {
				return ConvertErrorToApiErrorResponse(error)
			}

			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.GetStoreBookCollection(params)
		}
	}
	//#endregion

	//#region StoreBookCollectionName
	async SetStoreBookCollectionName(params: {
		uuid: string,
		language: string,
		name: string
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		try {
			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/store/collection/${params.uuid}/name/${params.language}`,
				headers: {
					Authorization: Dav.accessToken,
					'Content-Type': 'application/json'
				},
				data: {
					name: params.name
				}
			})

			return {
				status: response.status,
				data: response.data
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.SetStoreBookCollectionName(params)
		}
	}
	//#endregion

	//#region StoreBook
	async CreateStoreBook(params: {
		author?: string,
		collection?: string,
		title: string,
		description?: string,
		language: string,
		price?: number,
		isbn?: string,
		categories?: string[]
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		try {
			let data = {}
			if (params.author) data["author"] = params.author
			if (params.collection) data["collection"] = params.collection
			if (params.title) data["title"] = params.title
			if (params.description) data["description"] = params.description
			if (params.language) data["language"] = params.language
			if (params.price) data["price"] = params.price
			if (params.isbn) data["isbn"] = params.isbn
			if (params.categories) data["categories"] = params.categories

			let response = await axios.default({
				method: 'post',
				url: `${environment.pocketlibApiBaseUrl}/store/book`,
				headers: {
					Authorization: Dav.accessToken,
					'Content-Type': 'application/json'
				},
				data
			})

			return {
				status: response.status,
				data: response.data
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.CreateStoreBook(params)
		}
	}

	async GetStoreBook(params: {
		uuid: string
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		let uuid = params.uuid

		// Check if the response is cached
		let cacheResponseKey = this.GetApiRequestCacheKey(this.GetStoreBook.name, {
			uuid
		})
		let cachedResponse = this.apiRequestCache[cacheResponseKey]
		if (cachedResponse) return cachedResponse

		try {
			let options: axios.AxiosRequestConfig = {
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/store/book/${params.uuid}`
			}

			if (Dav.accessToken != null) {
				options.headers = {
					Authorization: Dav.accessToken
				}
			}

			let response = await axios.default(options)

			let result = {
				status: response.status,
				data: response.data
			}

			// Add the response to the cache
			this.apiRequestCache[cacheResponseKey] = result
			return result
		} catch (error) {
			if (Dav.accessToken == null) {
				return ConvertErrorToApiErrorResponse(error)
			}

			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.GetStoreBook(params)
		}
	}

	async GetStoreBooksByCategory(params: {
		key: string,
		languages?: string[],
		limit?: number,
		page?: number
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		let key = params.key
		let languages = params.languages != null ? params.languages.join(',') : "en"
		let limit = params.limit != null ? params.limit : 50
		let page = params.page != null ? params.page : 1

		// Check if the response is cached
		let cacheResponseKey = this.GetApiRequestCacheKey(this.GetStoreBooksByCategory.name, {
			key,
			languages,
			limit,
			page
		})
		let cachedResponse = this.apiRequestCache[cacheResponseKey]
		if (cachedResponse) return cachedResponse

		try {
			let response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/store/books/category/${params.key}`,
				params: {
					languages,
					limit,
					page
				}
			})

			let result = {
				status: response.status,
				data: response.data
			}

			// Add the response to the cache
			this.apiRequestCache[cacheResponseKey] = result
			return result
		} catch (error) {
			return ConvertErrorToApiErrorResponse(error)
		}
	}

	async GetLatestStoreBooks(params: {
		languages?: string[],
		limit?: number,
		page?: number
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		let languages = params.languages != null ? params.languages.join(',') : "en"
		let limit = params.limit != null ? params.limit : 50
		let page = params.page != null ? params.page : 1

		// Check if the response is cached
		let cacheResponseKey = this.GetApiRequestCacheKey(this.GetLatestStoreBooks.name, {
			languages,
			limit,
			page
		})
		let cachedResponse = this.apiRequestCache[cacheResponseKey]
		if (cachedResponse) return cachedResponse

		try {
			let response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/store/books/latest`,
				params: {
					languages,
					limit,
					page
				}
			})

			let result = {
				status: response.status,
				data: response.data
			}

			// Add the response to the cache
			this.apiRequestCache[cacheResponseKey] = result
			return result
		} catch (error) {
			return ConvertErrorToApiErrorResponse(error)
		}
	}

	async GetStoreBooksInReview(): Promise<ApiResponse<any> | ApiErrorResponse> {
		// Check if the response is cached
		let cacheResponseKey = this.GetApiRequestCacheKey(this.GetStoreBooksInReview.name, {})
		let cachedResponse = this.apiRequestCache[cacheResponseKey]
		if (cachedResponse) return cachedResponse

		try {
			let response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/store/books/review`,
				headers: {
					Authorization: Dav.accessToken
				}
			})

			let result = {
				status: response.status,
				data: response.data
			}

			// Add the response to the cache
			this.apiRequestCache[cacheResponseKey] = result
			return result
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.GetStoreBooksInReview()
		}
	}

	async UpdateStoreBook(params: {
		uuid: string,
		title?: string,
		description?: string,
		language?: string,
		price?: number,
		isbn?: string,
		published?: boolean,
		status?: string,
		categories?: string[]
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		try {
			let data = {}
			if (params.title != null) data["title"] = params.title
			if (params.description != null) data["description"] = params.description
			if (params.language != null) data["language"] = params.language
			if (params.price != null) data["price"] = params.price
			if (params.isbn != null) data["isbn"] = params.isbn
			if (params.published != null) data["published"] = params.published
			if (params.status != null) data["status"] = params.status
			if (params.categories != null) data["categories"] = params.categories

			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/store/book/${params.uuid}`,
				headers: {
					Authorization: Dav.accessToken,
					'Content-Type': 'application/json'
				},
				data
			})

			return {
				status: response.status,
				data: response.data
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.UpdateStoreBook(params)
		}
	}

	async CreatePurchaseForStoreBook(params: {
		uuid: string,
		currency: string
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		try {
			let response = await axios.default({
				method: 'post',
				url: `${environment.pocketlibApiBaseUrl}/store/book/${params.uuid}/purchase`,
				headers: {
					Authorization: Dav.accessToken,
					'Content-Type': 'application/json'
				},
				data: {
					currency: params.currency
				}
			})

			return {
				status: response.status,
				data: response.data
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.CreatePurchaseForStoreBook(params)
		}
	}
	//#endregion

	//#region StoreBookCover
	async SetStoreBookCover(params: {
		uuid: string,
		type: string,
		file: any
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		try {
			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/store/book/${params.uuid}/cover`,
				headers: {
					Authorization: Dav.accessToken,
					'Content-Type': params.type
				},
				data: params.file
			})

			return {
				status: response.status,
				data: response.data
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.SetStoreBookCover(params)
		}
	}

	async GetStoreBookCover(params: {
		uuid: string
	}): Promise<ApiResponse<string> | ApiErrorResponse> {
		let uuid = params.uuid

		// Check if the response is cached
		let cacheResponseKey = this.GetApiRequestCacheKey(this.GetStoreBookCover.name, {
			uuid
		})
		let cachedResponse = this.apiRequestCache[cacheResponseKey]
		if (cachedResponse) return cachedResponse

		try {
			let response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/store/book/${uuid}/cover`,
				responseType: 'blob'
			})

			let result = {
				status: response.status,
				data: null
			}

			if (response.data.size > 0) result.data = await BlobToBase64(response.data)

			// Add the response to the cache
			this.apiRequestCache[cacheResponseKey] = result
			return result
		} catch (error) {
			return ConvertErrorToApiErrorResponse(error)
		}
	}
	//#endregion

	//#region StoreBookFile
	async SetStoreBookFile(params: {
		uuid: string,
		type: string,
		name: string,
		file: any
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		try {
			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/store/book/${params.uuid}/file`,
				headers: {
					Authorization: Dav.accessToken,
					'Content-Type': params.type,
					'Content-Disposition': `attachment; filename="${params.name}"`
				},
				data: params.file
			})

			return {
				status: response.status,
				data: response.data
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.SetStoreBookFile(params)
		}
	}
	//#endregion

	//#region Book
	async CreateBook(params: {
		storeBook: string
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		try {
			let response = await axios.default({
				method: 'post',
				url: `${environment.pocketlibApiBaseUrl}/book`,
				headers: {
					Authorization: Dav.accessToken,
					'Content-Type': 'application/json'
				},
				data: {
					store_book: params.storeBook
				}
			})

			return {
				status: response.status,
				data: response.data
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.CreateBook(params)
		}
	}
	//#endregion

	//#region Category
	async GetCategories(): Promise<ApiResponse<any> | ApiErrorResponse> {
		// Check if the response is cached
		let cacheResponseKey = this.GetApiRequestCacheKey(this.GetCategories.name, {})
		let cachedResponse = this.apiRequestCache[cacheResponseKey]
		if (cachedResponse) return cachedResponse

		try {
			let response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/store/categories`
			})

			let result = {
				status: response.status,
				data: response.data
			}

			// Add the response to the cache
			this.apiRequestCache[cacheResponseKey] = result
			return result
		} catch (error) {
			return ConvertErrorToApiErrorResponse(error)
		}
	}
	//#endregion

	//#region Api Cache functions
	private GetApiRequestCacheKey(functionName: string, params: object): string {
		let apiRequestCacheKey = functionName

		for (let key of Object.keys(params)) {
			let value = params[key]
			apiRequestCacheKey += `,${key}:${value}`
		}

		return apiRequestCacheKey
	}

	ClearCache(functionName: string) {
		for (let selectedKey of Object.keys(this.apiRequestCache).filter(key => key.startsWith(functionName))) {
			delete this.apiRequestCache[selectedKey]
		}
	}
	//#endregion

	//#region Other functions
	async LoadCollectionsOfAuthor(author: Author) {
		for (let collection of author.collections) {
			// If collection.books is empty, load the books of the collection
			if (collection.books != null) continue
	
			let collectionResponse = await this.GetStoreBookCollection({
				uuid: collection.uuid
			})
			if (collectionResponse.status != 200) continue
	
			let collectionResponseData = (collectionResponse as ApiResponse<any>).data
			let collectionBooks = []
	
			// Get the books
			for (let book of collectionResponseData.books) {
				let newBook = {
					uuid: book.uuid,
					title: book.title,
					description: book.description,
					language: book.language,
					price: book.price ? parseInt(book.price) : 0,
					status: GetBookStatusByString(book.status),
					cover: book.cover,
					coverContent: null,
					file: book.file
				}
	
				if (book.cover) {
					this.GetStoreBookCover({ uuid: book.uuid }).then((result: ApiResponse<string>) => {
						newBook.coverContent = result.data
					})
				}
	
				collectionBooks.push(newBook)
			}
	
			collection.books = collectionBooks
		}
	}
	//#endregion
}