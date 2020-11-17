import { Injectable } from '@angular/core'
import * as axios from 'axios'
import { ApiResponse } from 'dav-npm'
import { environment } from 'src/environments/environment'

@Injectable()
export class ApiService{
	//#region Author functions
	async CreateAuthor(params: {
		jwt: string,
		firstName: string,
		lastName: string
	}): Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}}

		try{
			let data = {}
			if(params.firstName != null) data["first_name"] = params.firstName
			if(params.lastName != null) data["last_name"] = params.lastName

			let response = await axios.default({
				method: 'post',
				url: `${environment.pocketlibApiBaseUrl}/author`,
				headers: {
					Authorization: params.jwt,
					'Content-Type': 'application/json'
				},
				data
			})
	
			result.status = response.status
			result.data = response.data
		}catch(error){
			if(error.response){
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}

	async GetAuthorOfUser(params: {
		jwt: string
	}): Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}}

		try{
			let response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/author`,
				headers: {
					Authorization: params.jwt
				}
			})

			result.status = response.status
			result.data = response.data
		}catch(error){
			if(error.response){
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
	}): Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}}

		try{
			let parameters = {}
			if(params.books != null){
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
		}catch(error){
			if(error.response){
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}

	async GetLatestAuthors(): Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}}

		try{
			var response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/authors/latest`
			})

			result.status = response.status
			result.data = response.data
		}catch(error){
			if(error.response){
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}
	//#endregion

	//#region AuthorBio
	async SetBioOfAuthorOfUser(params: {
		jwt: string,
		language: string,
		bio: string
	}): Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = { status: -1, data: {} };

		try{
			let data = {}
			if (params.bio != null) data["bio"] = params.bio

			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/author/bio/${params.language}`,
				headers: {
					Authorization: params.jwt,
					'Content-Type': 'application/json'
				},
				data
			})

			result.status = response.status
			result.data = response.data
		}catch(error){
			if(error.response){
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}

	async SetBioOfAuthor(params: {
		jwt: string,
		uuid: string,
		language: string,
		bio: string
	}): Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}}

		try{
			let data = {}
			if(params.bio != null) data["bio"] = params.bio

			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/author/${params.uuid}/bio/${params.language}`,
				headers: {
					Authorization: params.jwt,
					'Content-Type': 'application/json'
				},
				data
			})

			result.status = response.status
			result.data = response.data
		}catch(error){
			if(error.response){
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}
	//#endregion

	//#region AuthorProfileImage
	async SetProfileImageOfAuthorOfUser(params: {
		jwt: string,
		type: string,
		file: any
	}): Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}}

		try{
			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/author/profile_image`,
				headers: {
					Authorization: params.jwt,
					'Content-Type': params.type
				},
				data: params.file
			})

			result.status = response.status
			result.data = response.data
		}catch(error){
			if(error.response){
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}

	async SetProfileImageOfAuthor(params: {
		jwt: string,
		uuid: string,
		type: string,
		file: any
	}): Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}}

		try{
			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/author/${params.uuid}/profile_image`,
				headers: {
					Authorization: params.jwt,
					'Content-Type': params.type
				},
				data: params.file
			})

			result.status = response.status
			result.data = response.data
		}catch(error){
			if(error.response){
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}
	//#endregion

	//#region StoreBookCollection
	async CreateStoreBookCollection(params: {
		jwt: string,
		author?: string,
		name: string,
		language: string
	}): Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}}

		try{
			let data = {}
			if(params.name != null) data["name"] = params.name
			if(params.language != null) data["language"] = params.language
			if(params.author != null) data["author"] = params.author

			let response = await axios.default({
				method: 'post',
				url: `${environment.pocketlibApiBaseUrl}/store/collection`,
				headers: {
					Authorization: params.jwt,
					'Content-Type': 'application/json'
				},
				data
			})

			result.status = response.status
			result.data = response.data
		}catch(error){
			if(error.response){
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}

	async GetStoreBookCollection(params: {
		jwt?: string,
		uuid: string
	}): Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}}

		try{
			let options: axios.AxiosRequestConfig = {
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/store/collection/${params.uuid}`
			}

			if(params.jwt != null){
				options.headers = {
					Authorization: params.jwt
				}
			}

			let response = await axios.default(options)

			result.status = response.status
			result.data = response.data
		}catch(error){
			if(error.response){
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}
	//#endregion

	//#region StoreBookCollectionName
	async SetStoreBookCollectionName(params: {
		jwt: string,
		uuid: string,
		language: string,
		name: string
	}): Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}}

		try{
			let data = {}
			if(params.name != null) data["name"] = params.name

			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/store/collection/${params.uuid}/name/${params.language}`,
				headers: {
					Authorization: params.jwt,
					'Content-Type': 'application/json'
				},
				data
			})

			result.status = response.status
			result.data = response.data
		}catch(error){
			if(error.response){
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}
	//#endregion

	//#region StoreBook
	async CreateStoreBook(params: {
		jwt: string,
		collection: string,
		title: string,
		description?: string,
		language: string,
		price?: number,
		categories?: string[]
	}): Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}}

		try{
			let data = {}
			if (params.collection) data["collection"] = params.collection
			if (params.title) data["title"] = params.title
			if (params.description) data["description"] = params.description
			if (params.language) data["language"] = params.language
			if (params.price) data["price"] = params.price
			if (params.categories) data["categories"] = params.categories

			let response = await axios.default({
				method: 'post',
				url: `${environment.pocketlibApiBaseUrl}/store/book`,
				headers: {
					Authorization: params.jwt,
					'Content-Type': 'application/json'
				},
				data
			})

			result.status = response.status
			result.data = response.data
		}catch(error){
			if(error.response){
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}

	async GetStoreBook(params: {
		jwt?: string,
		uuid: string
	}): Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}}

		try{
			let options: axios.AxiosRequestConfig = {
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/store/book/${params.uuid}`
			}

			if(params.jwt != null){
				options.headers = {
					Authorization: params.jwt
				}
			}

			let response = await axios.default(options)

			result.status = response.status
			result.data = response.data
		}catch(error){
			if(error.response){
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}

	async GetStoreBooksByCategory(params: {
		key: string,
		languages?: string[]
	}): Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}}

		try{
			let parameters = {}
			if(params.languages != null) parameters["languages"] = params.languages.join(',')

			let response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/store/books/category/${params.key}`,
				params: parameters
			})

			result.status = response.status
			result.data = response.data
		}catch(error){
			if(error.response){
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}

	async GetLatestStoreBooks(params: {
		languages?: string[]
	}): Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}}

		try{
			let parameters = {};
			if(params.languages != null) parameters["languages"] = params.languages.join(',')

			let response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/store/books/latest`,
				params: parameters
			})

			result.status = response.status
			result.data = response.data
		}catch(error){
			if(error.response){
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}

	async GetStoreBooksInReview(params: {
		jwt: string
	}): Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}}

		try{
			let response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/store/books/review`,
				headers: {
					Authorization: params.jwt
				}
			})

			result.status = response.status
			result.data = response.data
		}catch(error){
			if(error.response){
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}

	async UpdateStoreBook(params: {
		jwt: string,
		uuid: string,
		title?: string,
		description?: string,
		language?: string,
		price?: number,
		published?: boolean,
		status?: string,
		categories?: string[]
	}): Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}}

		try{
			let data = {}
			if (params.title != null) data["title"] = params.title
			if (params.description != null) data["description"] = params.description
			if (params.language != null) data["language"] = params.language
			if (params.price != null) data["price"] = params.price
			if (params.published != null) data["published"] = params.published
			if (params.status != null) data["status"] = params.status
			if (params.categories != null) data["categories"] = params.categories

			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/store/book/${params.uuid}`,
				headers: {
					Authorization: params.jwt,
					'Content-Type': 'application/json'
				},
				data
			})

			result.status = response.status
			result.data = response.data
		}catch(error){
			if(error.response){
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}
	//#endregion

	//#region StoreBookCover
	async SetStoreBookCover(params: {
		jwt: string,
		uuid: string,
		type: string,
		file: any
	}): Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}}

		try{
			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/store/book/${params.uuid}/cover`,
				headers: {
					Authorization: params.jwt,
					'Content-Type': params.type
				},
				data: params.file
			})

			result.status = response.status
			result.data = response.data
		}catch(error){
			if(error.response){
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}
	//#endregion

	//#region StoreBookFile
	async SetStoreBookFile(params: {
		jwt: string,
		uuid: string,
		type: string,
		file: any
	}): Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}}

		try{
			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/store/book/${params.uuid}/file`,
				headers: {
					Authorization: params.jwt,
					'Content-Type': params.type
				},
				data: params.file
			})

			result.status = response.status
			result.data = response.data
		}catch(error){
			if(error.response){
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}
	//#endregion

	//#region Book
	async CreateBook(params: {
		jwt: string,
		storeBook: string
	}): Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}}

		try{
			let data = {}
			if(params.storeBook != null) data["store_book"] = params.storeBook

			let response = await axios.default({
				method: 'post',
				url: `${environment.pocketlibApiBaseUrl}/book`,
				headers: {
					Authorization: params.jwt,
					'Content-Type': 'application/json'
				},
				data
			})

			result.status = response.status
			result.data = response.data
		}catch(error){
			if(error.response){
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}
	//#endregion

	//#region Category
	async GetCategories(): Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}}

		try{
			let response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/store/categories`
			})

			result.status = response.status
			result.data = response.data
		}catch(error){
			if(error.response){
				result.status = error.response.status
				result.data = error.response.data
			}
		}

		return result
	}
	//#endregion
}