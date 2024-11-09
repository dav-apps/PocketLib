import { Injectable } from "@angular/core"
import { Apollo, ApolloBase, gql, MutationResult } from "apollo-angular"
import { ApolloQueryResult, ErrorPolicy } from "@apollo/client/core"
import axios from "axios"
import { Dav, BlobToBase64, renewSession } from "dav-js"
import { environment } from "src/environments/environment"
import { pocketlibApiClientName } from "src/constants/constants"
import * as ErrorCodes from "src/constants/errorCodes"
import {
	List,
	ApiResponse,
	PublisherResource,
	PublisherLogoResource,
	AuthorResource,
	AuthorBioResource,
	AuthorProfileImageResource,
	StoreBookCollectionResource,
	StoreBookCollectionNameResource,
	StoreBookSeriesResource,
	StoreBookResource,
	StoreBookCoverResource,
	StoreBookFileResource,
	StoreBookPrintCoverResource,
	StoreBookPrintFileResource,
	StoreBookReleaseResource,
	CategoryResource,
	BookResource,
	CheckoutSessionResource,
	VlbItemResource
} from "../misc/types"
import { CachingService } from "./caching-service"

const errorPolicy: ErrorPolicy = "all"

@Injectable()
export class ApiService {
	private apollo: ApolloBase

	constructor(
		private cachingService: CachingService,
		private apolloProvider: Apollo
	) {
		this.loadApolloClient()
	}

	loadApolloClient() {
		this.apollo = this.apolloProvider.use(pocketlibApiClientName)
	}

	//#region Publisher
	async retrievePublisher(
		queryData: string,
		variables: {
			uuid: string
			limit?: number
			offset?: number
			query?: string
		}
	): Promise<ApolloQueryResult<{ retrievePublisher: PublisherResource }>> {
		let limitParam = queryData.includes("limit") ? "$limit: Int" : ""
		let offsetParam = queryData.includes("offset") ? "$offset: Int" : ""
		let queryParam = queryData.includes("query") ? "$query: String" : ""

		let result = await this.apollo
			.query<{
				retrievePublisher: PublisherResource
			}>({
				query: gql`
					query RetrievePublisher(
						$uuid: String!
						${limitParam}
						${offsetParam}
						${queryParam}
					) {
						retrievePublisher(uuid: $uuid) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.retrievePublisher(queryData, variables)
		}

		return result
	}

	async listPublishers(
		queryData: string,
		variables?: { limit?: number; offset?: number }
	): Promise<ApolloQueryResult<{ listPublishers: List<PublisherResource> }>> {
		let result = await this.apollo
			.query<{
				listPublishers: List<PublisherResource>
			}>({
				query: gql`
					query ListPublishers($limit: Int, $offset: Int) {
						listPublishers(limit: $limit, offset: $offset) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.listPublishers(queryData, variables)
		}

		return result
	}

	async createPublisher(
		queryData: string,
		variables: { name: string }
	): Promise<MutationResult<{ createPublisher: PublisherResource }>> {
		let result = await this.apollo
			.mutate<{ createPublisher: PublisherResource }>({
				mutation: gql`
					mutation CreatePublisher($name: String!) {
						createPublisher(name: $name) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.createPublisher(queryData, variables)
		}

		return result
	}

	async updatePublisher(
		queryData: string,
		variables: {
			uuid: string
			name?: string
			description?: string
			websiteUrl?: string
			facebookUsername?: string
			instagramUsername?: string
			twitterUsername?: string
		}
	): Promise<MutationResult<{ updatePublisher: PublisherResource }>> {
		let result = await this.apollo
			.mutate<{
				updatePublisher: PublisherResource
			}>({
				mutation: gql`
					mutation UpdatePublisher(
						$uuid: String!
						$name: String
						$description: String
						$websiteUrl: String
						$facebookUsername: String
						$instagramUsername: String
						$twitterUsername: String
					) {
						updatePublisher(
							uuid: $uuid
							name: $name
							description: $description
							websiteUrl: $websiteUrl
							facebookUsername: $facebookUsername
							instagramUsername: $instagramUsername
							twitterUsername: $twitterUsername
						) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.updatePublisher(queryData, variables)
		}

		return result
	}
	//#endregion

	//#region PublisherLogo
	async uploadPublisherLogo(params: {
		uuid: string
		contentType: string
		data: any
	}): Promise<ApiResponse<PublisherLogoResource>> {
		try {
			let response = await axios({
				method: "put",
				url: `${environment.pocketlibApiUrl}/publishers/${params.uuid}/logo`,
				headers: {
					Authorization: Dav.accessToken,
					"Content-Type": params.contentType
				},
				data: params.data
			})

			return {
				status: response.status,
				data: {
					uuid: response.data.uuid,
					url: response.data.url,
					blurhash: response.data.blurhash
				}
			}
		} catch (error) {
			if (error.response?.data == null) {
				return { status: 500 }
			}

			if (error.response.data.code == ErrorCodes.sessionEnded) {
				// Renew the access token and run the query again
				await renewSession()

				return await this.uploadPublisherLogo(params)
			}

			return {
				status: error.response.status,
				error: {
					code: error.response.data.code,
					message: error.response.data.message
				}
			}
		}
	}
	//#endregion

	//#region Author
	async retrieveAuthor(
		queryData: string,
		variables: {
			uuid: string
			languages?: string[]
			limit?: number
			offset?: number
		}
	): Promise<ApolloQueryResult<{ retrieveAuthor: AuthorResource }>> {
		let languagesParam = queryData.includes("languages")
			? `$languages: [String!]`
			: ""
		let limitParam = queryData.includes("limit") ? "$limit: Int" : ""
		let offsetParam = queryData.includes("offset") ? "$offset: Int" : ""

		let result = await this.apollo
			.query<{
				retrieveAuthor: AuthorResource
			}>({
				query: gql`
					query RetrieveAuthor(
						$uuid: String!
						${languagesParam}
						${limitParam}
						${offsetParam}
					) {
						retrieveAuthor(uuid: $uuid) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.retrieveAuthor(queryData, variables)
		}

		return result
	}

	async listAuthors(
		queryData: string,
		variables?: {
			mine?: boolean
			random?: boolean
			limit?: number
			offset?: number
		}
	): Promise<ApolloQueryResult<{ listAuthors: List<AuthorResource> }>> {
		let result = await this.apollo
			.query<{
				listAuthors: List<AuthorResource>
			}>({
				query: gql`
					query ListAuthors(
						$mine: Boolean
						$random: Boolean
						$limit: Int
						$offset: Int
					) {
						listAuthors(
							mine: $mine
							random: $random
							limit: $limit
							offset: $offset
						) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.listAuthors(queryData, variables)
		}

		return result
	}

	async createAuthor(
		queryData: string,
		variables: {
			publisher?: string
			firstName: string
			lastName: string
		}
	): Promise<MutationResult<{ createAuthor: AuthorResource }>> {
		let result = await this.apollo
			.mutate<{
				createAuthor: AuthorResource
			}>({
				mutation: gql`
					mutation CreateAuthor(
						$publisher: String
						$firstName: String!
						$lastName: String!
					) {
						createAuthor(
							publisher: $publisher
							firstName: $firstName
							lastName: $lastName
						) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.createAuthor(queryData, variables)
		}

		return result
	}

	async updateAuthor(
		queryData: string,
		variables?: {
			uuid: string
			firstName?: string
			lastName?: string
			websiteUrl?: string
			facebookUsername?: string
			instagramUsername?: string
			twitterUsername?: string
		}
	): Promise<MutationResult<{ updateAuthor: AuthorResource }>> {
		let result = await this.apollo
			.mutate<{
				updateAuthor: AuthorResource
			}>({
				mutation: gql`
					mutation UpdateAuthor(
						$uuid: String!
						$firstName: String
						$lastName: String
						$websiteUrl: String
						$facebookUsername: String
						$instagramUsername: String
						$twitterUsername: String
					) {
						updateAuthor(
							uuid: $uuid
							firstName: $firstName
							lastName: $lastName
							websiteUrl: $websiteUrl
							facebookUsername: $facebookUsername
							instagramUsername: $instagramUsername
							twitterUsername: $twitterUsername
						) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.updateAuthor(queryData, variables)
		}

		return result
	}
	//#endregion

	//#region AuthorBio
	async setAuthorBio(
		queryData: string,
		variables: { uuid: string; bio: string; language: string }
	): Promise<MutationResult<{ setAuthorBio: AuthorBioResource }>> {
		let result = await this.apollo
			.mutate<{ setAuthorBio: AuthorBioResource }>({
				mutation: gql`
					mutation SetAuthorBio(
						$uuid: String!
						$bio: String!
						$language: String!
					) {
						setAuthorBio(
							uuid: $uuid
							bio: $bio
							language: $language
						) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.setAuthorBio(queryData, variables)
		}

		return result
	}
	//#endregion

	//#region AuthorProfileImage
	async uploadAuthorProfileImage(params: {
		uuid: string
		contentType: string
		data: any
	}): Promise<ApiResponse<AuthorProfileImageResource>> {
		try {
			let response = await axios({
				method: "put",
				url: `${environment.pocketlibApiUrl}/authors/${params.uuid}/profileImage`,
				headers: {
					Authorization: Dav.accessToken,
					"Content-Type": params.contentType
				},
				data: params.data
			})

			return {
				status: response.status,
				data: {
					uuid: response.data.uuid,
					url: response.data.url,
					blurhash: response.data.blurhash
				}
			}
		} catch (error) {
			if (error.response?.data == null) {
				return { status: 500 }
			}

			if (error.response.data.code == ErrorCodes.sessionEnded) {
				// Renew the access token and run the query again
				await renewSession()

				return await this.uploadAuthorProfileImage(params)
			}

			return {
				status: error.response.status,
				error: {
					code: error.response.data.code,
					message: error.response.data.message
				}
			}
		}
	}
	//#endregion

	//#region StoreBookCollection
	async retrieveStoreBookCollection(
		queryData: string,
		variables: {
			uuid: string
			languages?: string[]
			limit?: number
			offset?: number
		}
	): Promise<
		ApolloQueryResult<{
			retrieveStoreBookCollection: StoreBookCollectionResource
		}>
	> {
		let languagesParam = queryData.includes("languages")
			? `$languages: [String!]`
			: ""
		let limitParam = queryData.includes("limit") ? "$limit: Int" : ""
		let offsetParam = queryData.includes("offset") ? "$offset: Int" : ""

		let result = await this.apollo
			.query<{
				retrieveStoreBookCollection: StoreBookCollectionResource
			}>({
				query: gql`
					query RetrieveStoreBookCollection(
						$uuid: String!
						${languagesParam}
						${limitParam}
						${offsetParam}
					) {
						retrieveStoreBookCollection(uuid: $uuid) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.retrieveStoreBookCollection(queryData, variables)
		}

		return result
	}
	//#endregion

	//#region StoreBookCollectionName
	async retrieveStoreBookCollectionName(
		queryData: string,
		variables: { uuid: string }
	): Promise<
		ApolloQueryResult<{
			retrieveStoreBookCollectionName: StoreBookCollectionNameResource
		}>
	> {
		let result = await this.apollo
			.query<{
				retrieveStoreBookCollectionName: StoreBookCollectionNameResource
			}>({
				query: gql`
					query RetrieveStoreBookCollectionName($uuid: String!) {
						retrieveStoreBookCollectionName(uuid: $uuid) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.retrieveStoreBookCollectionName(queryData, variables)
		}

		return result
	}

	async setStoreBookCollectionName(
		queryData: string,
		variables: { uuid: string; name: string; language: string }
	): Promise<
		MutationResult<{
			setStoreBookCollectionName: StoreBookCollectionNameResource
		}>
	> {
		let result = await this.apollo
			.mutate<{
				setStoreBookCollectionName: StoreBookCollectionNameResource
			}>({
				mutation: gql`
					mutation SetStoreBookCollectionName(
						$uuid: String!
						$name: String!
						$language: String!
					) {
						setStoreBookCollectionName(
							uuid: $uuid
							name: $name
							language: $language
						) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.setStoreBookCollectionName(queryData, variables)
		}

		return result
	}
	//#endregion

	//#region StoreBookSeries
	async retrieveStoreBookSeries(
		queryData: string,
		variables: {
			uuid: string
			languages?: string[]
			limit?: number
			offset?: number
		}
	): Promise<
		ApolloQueryResult<{ retrieveStoreBookSeries: StoreBookSeriesResource }>
	> {
		let languagesParam = queryData.includes("languages")
			? `$languages: [String!]`
			: ""
		let limitParam = queryData.includes("limit") ? "$limit: Int" : ""
		let offsetParam = queryData.includes("offset") ? "$offset: Int" : ""

		let result = await this.apollo
			.query<{ retrieveStoreBookSeries: StoreBookSeriesResource }>({
				query: gql`
					query RetrieveStoreBookSeries(
						$uuid: String!
						${languagesParam}
						${limitParam}
						${offsetParam}
					) {
						retrieveStoreBookSeries(uuid: $uuid) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.retrieveStoreBookSeries(queryData, variables)
		}

		return result
	}

	async listStoreBookSeries(
		queryData: string,
		variables?: {
			random?: boolean
			languages?: string[]
			limit?: number
			offset?: number
		}
	): Promise<
		ApolloQueryResult<{ listStoreBookSeries: List<StoreBookSeriesResource> }>
	> {
		let result = await this.apollo
			.query<{
				listStoreBookSeries: List<StoreBookSeriesResource>
			}>({
				query: gql`
					query ListStoreBookSeries(
						$random: Boolean
						$languages: [String!]
						$limit: Int
						$offset: Int
					) {
						listStoreBookSeries(
							random: $random
							languages: $languages
							limit: $limit
							offset: $offset
						) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.listStoreBookSeries(queryData, variables)
		}

		return result
	}

	async createStoreBookSeries(
		queryData: string,
		variables: {
			author?: string
			name: string
			language: string
			storeBooks?: string[]
		}
	): Promise<
		MutationResult<{ createStoreBookSeries: StoreBookSeriesResource }>
	> {
		let result = await this.apollo
			.mutate<{ createStoreBookSeries: StoreBookSeriesResource }>({
				mutation: gql`
					mutation CreateStoreBookSeries(
						$author: String
						$name: String!
						$language: String!
						$storeBooks: [String!]
					) {
						createStoreBookSeries(
							author: $author
							name: $name
							language: $language
							storeBooks: $storeBooks
						) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.createStoreBookSeries(queryData, variables)
		}

		return result
	}

	async updateStoreBookSeries(
		queryData: string,
		variables: {
			uuid: string
			name?: string
			storeBooks?: string[]
		}
	): Promise<
		MutationResult<{ updateStoreBookSeries: StoreBookSeriesResource }>
	> {
		let result = await this.apollo
			.mutate<{
				updateStoreBookSeries: StoreBookSeriesResource
			}>({
				mutation: gql`
					mutation UpdateStoreBookSeries(
						$uuid: String!
						$name: String
						$storeBooks: [String!]
					) {
						updateStoreBookSeries(
							uuid: $uuid
							name: $name
							storeBooks: $storeBooks
						) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.updateStoreBookSeries(queryData, variables)
		}

		return result
	}
	//#endregion

	//#region StoreBook
	async retrieveStoreBook(
		queryData: string,
		variables: { uuid: string; limit?: number; offset?: number }
	): Promise<ApolloQueryResult<{ retrieveStoreBook: StoreBookResource }>> {
		let limitParam = queryData.includes("limit") ? "$limit: Int" : ""
		let offsetParam = queryData.includes("offset") ? "$offset: Int" : ""

		let result = await this.apollo
			.query<{
				retrieveStoreBook: StoreBookResource
			}>({
				query: gql`
					query RetrieveStoreBook(
						$uuid: String!
						${limitParam}
						${offsetParam}
					) {
						retrieveStoreBook(uuid: $uuid) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.retrieveStoreBook(queryData, variables)
		}

		return result
	}

	async listStoreBooks(
		queryData: string,
		variables?: {
			categories?: string[]
			inReview?: boolean
			random?: boolean
			query?: string
			languages?: string[]
			limit?: number
			offset?: number
		}
	): Promise<ApolloQueryResult<{ listStoreBooks: List<StoreBookResource> }>> {
		let result = await this.apollo
			.query<{
				listStoreBooks: List<StoreBookResource>
			}>({
				query: gql`
					query ListStoreBooks(
						$categories: [String!]
						$inReview: Boolean
						$random: Boolean
						$query: String
						$languages: [String!]
						$limit: Int
						$offset: Int
					) {
						listStoreBooks(
							categories: $categories
							inReview: $inReview
							random: $random
							query: $query
							languages: $languages
							limit: $limit
							offset: $offset
						) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.listStoreBooks(queryData, variables)
		}

		return result
	}

	async createStoreBook(
		queryData: string,
		variables: {
			author?: string
			collection?: string
			title: string
			description?: string
			language: string
			price?: number
			printPrice?: number
			isbn?: string
			categories?: string[]
		}
	): Promise<MutationResult<{ createStoreBook: StoreBookResource }>> {
		let result = await this.apollo
			.mutate<{
				createStoreBook: StoreBookResource
			}>({
				mutation: gql`
					mutation CreateStoreBook(
						$author: String
						$collection: String
						$title: String!
						$description: String
						$language: String!
						$price: Int
						$printPrice: Int
						$isbn: String
						$categories: [String!]
					) {
						createStoreBook(
							author: $author
							collection: $collection
							title: $title
							description: $description
							language: $language
							price: $price
							printPrice: $printPrice
							isbn: $isbn
							categories: $categories
						) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.createStoreBook(queryData, variables)
		}

		return result
	}

	async updateStoreBook(
		queryData: string,
		variables: {
			uuid: string
			title?: string
			description?: string
			language?: string
			price?: number
			printPrice?: number
			isbn?: string
			status?: string
			categories?: string[]
		}
	): Promise<MutationResult<{ updateStoreBook: StoreBookResource }>> {
		let result = await this.apollo
			.mutate<{
				updateStoreBook: StoreBookResource
			}>({
				mutation: gql`
					mutation UpdateStoreBook(
						$uuid: String!
						$title: String
						$description: String
						$language: String
						$price: Int
						$printPrice: Int
						$isbn: String
						$status: String
						$categories: [String!]
					) {
						updateStoreBook(
							uuid: $uuid
							title: $title
							description: $description
							language: $language
							price: $price
							printPrice: $printPrice
							isbn: $isbn
							status: $status
							categories: $categories
						) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.updateStoreBook(queryData, variables)
		}

		return result
	}
	//#endregion

	//#region StoreBookCover
	async uploadStoreBookCover(params: {
		uuid: string
		contentType: string
		data: any
	}): Promise<ApiResponse<StoreBookCoverResource>> {
		try {
			let response = await axios({
				method: "put",
				url: `${environment.pocketlibApiUrl}/storeBooks/${params.uuid}/cover`,
				headers: {
					Authorization: Dav.accessToken,
					"Content-Type": params.contentType
				},
				data: params.data
			})

			return {
				status: response.status,
				data: {
					uuid: response.data.uuid,
					url: response.data.url,
					aspectRatio: response.data.aspectRatio,
					blurhash: response.data.blurhash
				}
			}
		} catch (error) {
			if (error.response?.data == null) {
				return { status: 500 }
			}

			if (error.response.data.code == ErrorCodes.sessionEnded) {
				// Renew the access token and run the query again
				await renewSession()

				return await this.uploadStoreBookCover(params)
			}

			return {
				status: error.response.status,
				error: {
					code: error.response.data.code,
					message: error.response.data.message
				}
			}
		}
	}
	//#endregion

	//#region StoreBookFile
	async uploadStoreBookFile(params: {
		uuid: string
		contentType: string
		data: any
		fileName: string
	}): Promise<ApiResponse<StoreBookFileResource>> {
		try {
			let response = await axios({
				method: "put",
				url: `${environment.pocketlibApiUrl}/storeBooks/${params.uuid}/file`,
				headers: {
					Authorization: Dav.accessToken,
					"Content-Type": params.contentType,
					"Content-Disposition": `attachment; filename="${encodeURIComponent(
						params.fileName
					)}"`
				},
				data: params.data
			})

			return {
				status: response.status,
				data: {
					uuid: response.data.uuid,
					fileName: response.data.fileName
				}
			}
		} catch (error) {
			if (error.response?.data == null) {
				return { status: 500 }
			}

			if (error.response.data.code == ErrorCodes.sessionEnded) {
				// Renew the access token and run the query again
				await renewSession()

				return await this.uploadStoreBookFile(params)
			}

			return {
				status: error.response.status,
				error: {
					code: error.response.data.code,
					message: error.response.data.message
				}
			}
		}
	}
	//#endregion

	//#region StoreBookPrintCover
	async uploadStoreBookPrintCover(params: {
		uuid: string
		data: any
		fileName: string
	}): Promise<ApiResponse<StoreBookPrintCoverResource>> {
		try {
			let response = await axios({
				method: "put",
				url: `${environment.pocketlibApiUrl}/storeBooks/${params.uuid}/printCover`,
				headers: {
					Authorization: Dav.accessToken,
					"Content-Type": "application/pdf",
					"Content-Disposition": `attachment; filename="${encodeURIComponent(
						params.fileName
					)}"`
				},
				data: params.data
			})

			return {
				status: response.status,
				data: {
					uuid: response.data.uuid,
					fileName: response.data.fileName
				}
			}
		} catch (error) {
			if (error.response?.data == null) {
				return { status: 500 }
			}

			if (error.response.data.code == ErrorCodes.sessionEnded) {
				// Renew the access token and run the query again
				await renewSession()

				return await this.uploadStoreBookPrintCover(params)
			}

			return {
				status: error.response.status,
				error: {
					code: error.response.data.code,
					message: error.response.data.message
				}
			}
		}
	}
	//#endregion

	//#region StoreBookPrintFile
	async uploadStoreBookPrintFile(params: {
		uuid: string
		data: any
		fileName: string
	}): Promise<ApiResponse<StoreBookPrintFileResource>> {
		try {
			let response = await axios({
				method: "put",
				url: `${environment.pocketlibApiUrl}/storeBooks/${params.uuid}/printFile`,
				headers: {
					Authorization: Dav.accessToken,
					"Content-Type": "application/pdf",
					"Content-Disposition": `attachment; filename="${encodeURIComponent(
						params.fileName
					)}"`
				},
				data: params.data
			})

			return {
				status: response.status,
				data: {
					uuid: response.data.uuid,
					fileName: response.data.fileName
				}
			}
		} catch (error) {
			if (error.response?.data == null) {
				return { status: 500 }
			}

			if (error.response.data.code == ErrorCodes.sessionEnded) {
				// Renew the access token and run the query again
				await renewSession()

				return await this.uploadStoreBookPrintFile(params)
			}

			return {
				status: error.response.status,
				error: {
					code: error.response.data.code,
					message: error.response.data.message
				}
			}
		}
	}
	//#endregion

	//#region StoreBookRelease
	async retrieveStoreBookRelease(
		queryData: string,
		variables: { uuid: string; limit?: number; offset?: number }
	): Promise<
		ApolloQueryResult<{ retrieveStoreBookRelease: StoreBookReleaseResource }>
	> {
		let limitParam = queryData.includes("limit") ? "$limit: Int" : ""
		let offsetParam = queryData.includes("offset") ? "$offset: Int" : ""

		let result = await this.apollo
			.query<{
				retrieveStoreBookRelease: StoreBookReleaseResource
			}>({
				query: gql`
					query RetrieveStoreBookRelease(
						$uuid: String!
						${limitParam}
						${offsetParam}
					) {
						retrieveStoreBookRelease(uuid: $uuid) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.retrieveStoreBookRelease(queryData, variables)
		}

		return result
	}

	async publishStoreBookRelease(
		queryData: string,
		variables: {
			uuid: string
			releaseName: string
			releaseNotes?: string
		}
	): Promise<
		MutationResult<{ publishStoreBookRelease: StoreBookReleaseResource }>
	> {
		let result = await this.apollo
			.mutate<{
				publishStoreBookRelease: StoreBookReleaseResource
			}>({
				mutation: gql`
					mutation PublishStoreBookRelease(
						$uuid: String!
						$releaseName: String!
						$releaseNotes: String
					) {
						publishStoreBookRelease(
							uuid: $uuid
							releaseName: $releaseName
							releaseNotes: $releaseNotes
						) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.publishStoreBookRelease(queryData, variables)
		}

		return result
	}
	//#endregion

	//#region Category
	async retrieveCategory(
		queryData: string,
		variables: { uuid: string; languages?: string[] }
	): Promise<ApolloQueryResult<{ retrieveCategory: CategoryResource }>> {
		let languagesParam = queryData.includes("languages")
			? `$languages: [String!]`
			: ""

		let result = await this.apollo
			.query<{ retrieveCategory: CategoryResource }>({
				query: gql`
				query RetrieveCategory(
					$uuid: String!
					${languagesParam}
				) {
					retrieveCategory(uuid: $uuid) {
						${queryData}
					}
				}
			`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.retrieveCategory(queryData, variables)
		}

		return result
	}

	async listCategories(
		queryData: string,
		variables?: { limit?: number; offset?: number; languages?: string[] }
	): Promise<ApolloQueryResult<{ listCategories: List<CategoryResource> }>> {
		let result = await this.apollo
			.query<{
				listCategories: List<CategoryResource>
			}>({
				query: gql`
					query ListCategories(
						$languages: [String!]
						$limit: Int,
						$offset: Int
					) {
						listCategories(
							languages: $languages
							limit: $limit
							offset: $offset
						) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.listCategories(queryData, variables)
		}

		return result
	}
	//#endregion

	//#region Book
	async createBook(
		queryData: string,
		variables: {
			storeBook: string
		}
	): Promise<MutationResult<{ createBook: BookResource }>> {
		let result = await this.apollo
			.mutate<{ createBook: BookResource }>({
				mutation: gql`
					mutation CreateBook($storeBook: String!) {
						createBook(storeBook: $storeBook) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.createBook(queryData, variables)
		}

		return result
	}
	//#endregion

	//#region CheckoutSession
	async createCheckoutSessionForStoreBook(
		queryData: string,
		variables: {
			storeBookUuid: string
			successUrl: string
			cancelUrl: string
		}
	): Promise<
		MutationResult<{
			createCheckoutSessionForStoreBook: CheckoutSessionResource
		}>
	> {
		let result = await this.apollo
			.mutate<{
				createCheckoutSessionForStoreBook: CheckoutSessionResource
			}>({
				mutation: gql`
					mutation CreateCheckoutSessionForStoreBook(
						$storeBookUuid: String!
						$successUrl: String!
						$cancelUrl: String!
					) {
						createCheckoutSessionForStoreBook(
							storeBookUuid: $storeBookUuid
							successUrl: $successUrl
							cancelUrl: $cancelUrl
						) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.createCheckoutSessionForStoreBook(
				queryData,
				variables
			)
		}

		return result
	}

	async createCheckoutSessionForVlbItem(
		queryData: string,
		variables: {
			productId: string
			successUrl: string
			cancelUrl: string
		}
	): Promise<
		MutationResult<{
			createCheckoutSessionForVlbItem: CheckoutSessionResource
		}>
	> {
		let result = await this.apollo
			.mutate<{
				createCheckoutSessionForVlbItem: CheckoutSessionResource
			}>({
				mutation: gql`
					mutation CreateCheckoutSessionForVlbItem(
						$productId: String!
						$successUrl: String!
						$cancelUrl: String!
					) {
						createCheckoutSessionForVlbItem(
							productId: $productId
							successUrl: $successUrl
							cancelUrl: $cancelUrl
						) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.createCheckoutSessionForVlbItem(queryData, variables)
		}

		return result
	}
	//#endregion

	//#region VlbItem
	async retrieveVlbItem(
		queryData: string,
		variables: {
			id: string
		}
	): Promise<ApolloQueryResult<{ retrieveVlbItem: VlbItemResource }>> {
		let result = await this.apollo
			.query<{
				retrieveVlbItem: VlbItemResource
			}>({
				query: gql`
				query RetrieveVlbItem($id: String!) {
					retrieveVlbItem(id: $id) {
						${queryData}
					}
				}
			`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.retrieveVlbItem(queryData, variables)
		}

		return result
	}

	async listVlbItems(
		queryData: string,
		variables: {
			random?: boolean
			collectionId?: string
			limit?: number
			offset?: number
		}
	): Promise<ApolloQueryResult<{ listVlbItems: List<VlbItemResource> }>> {
		let result = await this.apollo
			.query<{
				listVlbItems: List<VlbItemResource>
			}>({
				query: gql`
					query ListVlbItems(
						$random: Boolean
						$collectionId: String
						$limit: Int
						$offset: Int
					) {
						listVlbItems(
							random: $random
							collectionId: $collectionId
							limit: $limit
							offset: $offset
						) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.listVlbItems(queryData, variables)
		}

		return result
	}
	//#endregion

	//#region Misc
	async search(
		queryData: string,
		variables: {
			query: string
			limit?: number
			offset?: number
		}
	): Promise<ApolloQueryResult<{ search: List<VlbItemResource> }>> {
		let result = await this.apollo
			.query<{
				search: List<VlbItemResource>
			}>({
				query: gql`
					query Search(
						$query: String!
						$limit: Int
						$offset: Int
					) {
						search(
							query: $query
							limit: $limit
							offset: $offset
						) {
							${queryData}
						}
					}
				`,
				variables,
				errorPolicy
			})
			.toPromise()

		if (
			result.errors != null &&
			result.errors.length > 0 &&
			result.errors[0].extensions.code == ErrorCodes.sessionEnded
		) {
			// Renew the access token and run the query again
			await renewSession()

			return await this.search(queryData, variables)
		}

		return result
	}
	//#endregion

	//#region Other functions
	async downloadFile(url: string): Promise<ApiResponse<string>> {
		// Check if the response is cached
		let cacheResponseKey = this.cachingService.GetApiRequestCacheKey(
			this.downloadFile.name,
			{ url }
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
				url,
				responseType: "blob"
			})

			let result: ApiResponse<string> = {
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

			return {
				status: error.response.status,
				error: error.response.data
			}
		}
	}
	//#endregion
}
