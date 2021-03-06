import { Injectable } from '@angular/core'
import * as axios from 'axios'
import { Dav, ApiResponse } from 'dav-js'
import { environment } from 'src/environments/environment'

@Injectable()
export class ApiService {
	//#region Author functions
	async CreateAuthor(params: {
		firstName: string,
		lastName: string
	}): Promise<ApiResponse<any>> {
		var result: ApiResponse<any> = { status: -1, data: {} }

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

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}

	async GetAuthorOfUser(): Promise<ApiResponse<any>> {
		var result: ApiResponse<any> = { status: -1, data: {} }

		try {
			let response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/author`,
				headers: {
					Authorization: Dav.accessToken
				}
			})

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}

	async GetAuthor(params: {
		uuid: string,
		books?: boolean,
		language?: string
	}): Promise<ApiResponse<any>> {
		var result: ApiResponse<any> = { status: -1, data: {} }

		try {
			let parameters = {}
			if (params.books != null) {
				parameters["books"] = true
				parameters["language"] = params.language || "en"
			}

			let response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/author/${params.uuid}`,
				params: parameters
			})

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}

	async GetLatestAuthors(): Promise<ApiResponse<any>> {
		var result: ApiResponse<any> = { status: -1, data: {} }

		try {
			var response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/authors/latest`
			})

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}

	async UpdateAuthorOfUser(params: {
		firstName?: string,
		lastName?: string,
		websiteUrl?: string,
		facebookUsername?: string,
		instagramUsername?: string,
		twitterUsername?: string
	}): Promise<ApiResponse<any>> {
		let result: ApiResponse<any> = { status: -1, data: {} }

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

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}

	async UpdateAuthor(params: {
		uuid: string,
		firstName?: string,
		lastName?: string,
		websiteUrl?: string,
		facebookUsername?: string,
		instagramUsername?: string,
		twitterUsername?: string
	}): Promise<ApiResponse<any>> {
		let result: ApiResponse<any> = { status: -1, data: {} }

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

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}
	//#endregion

	//#region AuthorBio
	async SetBioOfAuthorOfUser(params: {
		language: string,
		bio: string
	}): Promise<ApiResponse<any>> {
		var result: ApiResponse<any> = { status: -1, data: {} }

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

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}

	async SetBioOfAuthor(params: {
		uuid: string,
		language: string,
		bio: string
	}): Promise<ApiResponse<any>> {
		var result: ApiResponse<any> = { status: -1, data: {} }

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

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}
	//#endregion

	//#region AuthorProfileImage
	async SetProfileImageOfAuthorOfUser(params: {
		type: string,
		file: any
	}): Promise<ApiResponse<any>> {
		var result: ApiResponse<any> = { status: -1, data: {} }

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

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}

	async SetProfileImageOfAuthor(params: {
		uuid: string,
		type: string,
		file: any
	}): Promise<ApiResponse<any>> {
		var result: ApiResponse<any> = { status: -1, data: {} }

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

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}
	//#endregion

	//#region StoreBookCollection
	async CreateStoreBookCollection(params: {
		author?: string,
		name: string,
		language: string
	}): Promise<ApiResponse<any>> {
		var result: ApiResponse<any> = { status: -1, data: {} }

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

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}

	async GetStoreBookCollection(params: {
		uuid: string
	}): Promise<ApiResponse<any>> {
		var result: ApiResponse<any> = { status: -1, data: {} }

		try {
			let options: axios.AxiosRequestConfig = {
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/store/collection/${params.uuid}`
			}

			if (Dav.accessToken != null) {
				options.headers = {
					Authorization: Dav.accessToken
				}
			}

			let response = await axios.default(options)

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}
	//#endregion

	//#region StoreBookCollectionName
	async SetStoreBookCollectionName(params: {
		uuid: string,
		language: string,
		name: string
	}): Promise<ApiResponse<any>> {
		var result: ApiResponse<any> = { status: -1, data: {} }

		try {
			let data = {}
			if (params.name != null) data["name"] = params.name

			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/store/collection/${params.uuid}/name/${params.language}`,
				headers: {
					Authorization: Dav.accessToken,
					'Content-Type': 'application/json'
				},
				data
			})

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}
	//#endregion

	//#region StoreBook
	async CreateStoreBook(params: {
		collection: string,
		title: string,
		description?: string,
		language: string,
		price?: number,
		isbn?: string,
		categories?: string[]
	}): Promise<ApiResponse<any>> {
		var result: ApiResponse<any> = { status: -1, data: {} }

		try {
			let data = {}
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

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}

	async GetStoreBook(params: {
		uuid: string
	}): Promise<ApiResponse<any>> {
		var result: ApiResponse<any> = { status: -1, data: {} }

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

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}

	async GetStoreBooksByCategory(params: {
		key: string,
		languages?: string[]
	}): Promise<ApiResponse<any>> {
		var result: ApiResponse<any> = { status: -1, data: {} }

		try {
			let parameters = {}
			if (params.languages != null) parameters["languages"] = params.languages.join(',')

			let response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/store/books/category/${params.key}`,
				params: parameters
			})

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}

	async GetLatestStoreBooks(params: {
		languages?: string[]
	}): Promise<ApiResponse<any>> {
		var result: ApiResponse<any> = { status: -1, data: {} }

		try {
			let parameters = {};
			if (params.languages != null) parameters["languages"] = params.languages.join(',')

			let response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/store/books/latest`,
				params: parameters
			})

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}

	async GetStoreBooksInReview(): Promise<ApiResponse<any>> {
		var result: ApiResponse<any> = { status: -1, data: {} }

		try {
			let response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/store/books/review`,
				headers: {
					Authorization: Dav.accessToken
				}
			})

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
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
	}): Promise<ApiResponse<any>> {
		var result: ApiResponse<any> = { status: -1, data: {} }

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

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}
	//#endregion

	//#region StoreBookCover
	async SetStoreBookCover(params: {
		uuid: string,
		type: string,
		file: any
	}): Promise<ApiResponse<any>> {
		var result: ApiResponse<any> = { status: -1, data: {} }

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

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}
	//#endregion

	//#region StoreBookFile
	async SetStoreBookFile(params: {
		uuid: string,
		type: string,
		name: string,
		file: any
	}): Promise<ApiResponse<any>> {
		var result: ApiResponse<any> = { status: -1, data: {} }

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

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}
	//#endregion

	//#region Book
	async CreateBook(params: {
		storeBook: string
	}): Promise<ApiResponse<any>> {
		var result: ApiResponse<any> = { status: -1, data: {} }

		try {
			let data = {}
			if (params.storeBook != null) data["store_book"] = params.storeBook

			let response = await axios.default({
				method: 'post',
				url: `${environment.pocketlibApiBaseUrl}/book`,
				headers: {
					Authorization: Dav.accessToken,
					'Content-Type': 'application/json'
				},
				data
			})

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}
	//#endregion

	//#region Category
	async GetCategories(): Promise<ApiResponse<any>> {
		var result: ApiResponse<any> = { status: -1, data: {} }

		try {
			let response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/store/categories`
			})

			result.status = response.status
			result.data = response.data
		} catch (error) {
			if (error.response) {
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}
	//#endregion
}