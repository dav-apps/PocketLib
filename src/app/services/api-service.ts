import { Injectable } from "@angular/core"
import axios from "axios"
import {
	Dav,
	ApiResponse,
	ApiErrorResponse,
	HandleApiError,
	PrepareRequestParams
} from "dav-js"
import { environment } from "src/environments/environment"
import {
	PublisherLogoResource,
	PublisherLogoField,
	AuthorProfileImageResource,
	AuthorProfileImageField,
	StoreBookCoverField,
	StoreBookFileField,
	BookResource,
	BookField
} from "src/app/misc/types"
import {
	ResponseDataToPublisherLogoResource,
	ResponseDataToAuthorProfileImageResource,
	ResponseDataToStoreBookCoverResource,
	ResponseDataToStoreBookFileResource,
	ResponseDataToBookResource
} from "src/app/misc/utils"

@Injectable()
export class ApiService {
	//#region PublisherLogo
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

	//#region AuthorProfileImage
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

	//#region StoreBookCover
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
}
