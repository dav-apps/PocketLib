import { Injectable } from "@angular/core"
import { Apollo, gql, MutationResult } from "apollo-angular"
import { ApolloQueryResult } from "@apollo/client/core"
import axios from "axios"
import {
	ApiResponse,
	ApiErrorResponse,
	BlobToBase64,
	ConvertErrorToApiErrorResponse
} from "dav-js"
import {
	List,
	UpdateResponse,
	PublisherResource2,
	AuthorResource2,
	AuthorBioResource2,
	StoreBookCollectionResource2,
	StoreBookCollectionNameResource2,
	StoreBookSeriesResource2,
	StoreBookResource2,
	CategoryResource2
} from "../misc/types"
import { CachingService } from "./caching-service"

@Injectable()
export class GraphQLService {
	constructor(
		private cachingService: CachingService,
		private apollo: Apollo
	) {}

	retrievePublisher(
		queryData: string,
		variables: { uuid: string }
	): Promise<ApolloQueryResult<{ retrievePublisher: PublisherResource2 }>> {
		return this.apollo
			.query<{
				retrievePublisher: PublisherResource2
			}>({
				query: gql`
					query RetrievePublisher($uuid: String) {
						retrievePublisher(uuid: $uuid) {
							${queryData}
						}
					}
				`,
				variables
			})
			.toPromise()
	}

	listPublishers(
		queryData: string,
		variables?: { limit?: number; offset?: number }
	): Promise<ApolloQueryResult<{ listPublishers: List<PublisherResource2> }>> {
		return this.apollo
			.query<{
				listPublishers: List<PublisherResource2>
			}>({
				query: gql`
					query ListPublishers($limit: Int, $offset, Int) {
						listPublishers(limit: $limit, offset: $offset) {
							${queryData}
						}
					}
				`,
				variables
			})
			.toPromise()
	}

	updatePublisher(
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
	): Promise<MutationResult<{ updatePublisher: PublisherResource2 }>> {
		return this.apollo
			.mutate<{
				updatePublisher: PublisherResource2
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
				variables
			})
			.toPromise()
	}

	retrieveAuthor(
		queryData: string,
		variables: { uuid: string; languages?: string[] }
	): Promise<ApolloQueryResult<{ retrieveAuthor: AuthorResource2 }>> {
		return this.apollo
			.query<{
				retrieveAuthor: AuthorResource2
			}>({
				query: gql`
					query RetrieveAuthor($uuid: String!) {
						retrieveAuthor(uuid: $uuid) {
							${queryData}
						}
					}
				`,
				variables
			})
			.toPromise()
	}

	listAuthors(
		queryData: string,
		variables?: {
			latest?: boolean
			mine?: boolean
			languages?: string[]
			limit?: number
			offset?: number
		}
	): Promise<ApolloQueryResult<{ listAuthors: List<AuthorResource2> }>> {
		return this.apollo
			.query<{
				listAuthors: List<AuthorResource2>
			}>({
				query: gql`
					query ListAuthors($limit: Int, $latest: Boolean) {
						listAuthors(limit: $limit, latest: $latest) {
							${queryData}
						}
					}
				`,
				variables
			})
			.toPromise()
	}

	updateAuthor(
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
	): Promise<
		MutationResult<{ updateAuthor: UpdateResponse<AuthorResource2> }>
	> {
		return this.apollo
			.mutate<{
				updateAuthor: UpdateResponse<AuthorResource2>
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
				variables
			})
			.toPromise()
	}

	setAuthorBio(
		queryData: string,
		variables: { uuid: string; bio: string; language: string }
	): Promise<
		MutationResult<{ setAuthorBio: UpdateResponse<AuthorBioResource2> }>
	> {
		return this.apollo
			.mutate<{ setAuthorBio: UpdateResponse<AuthorBioResource2> }>({
				mutation: gql`
					mutation SetAuthorBio($uuid: String!, $bio: String!, $language: String!) {
						setAuthorBio(uuid: $uuid, bio: $bio, language: $language) {
							${queryData}
						}
					}
				`,
				variables
			})
			.toPromise()
	}

	retrieveStoreBookCollection(
		queryData: string,
		variables: { uuid: string; languages?: string[] }
	): Promise<
		ApolloQueryResult<{
			retrieveStoreBookCollection: StoreBookCollectionResource2
		}>
	> {
		return this.apollo
			.query<{
				retrieveStoreBookCollection: StoreBookCollectionResource2
			}>({
				query: gql`
					query RetrieveStoreBookCollection($uuid: String!, languages: [String!]) {
						retrieveStoreBookCollection(uuid: $uuid, languages: $languages) {
							${queryData}
						}
					}
				`,
				variables
			})
			.toPromise()
	}

	setStoreBookCollectionName(
		queryData: string,
		variables: { uuid: string; name: string; language: string }
	): Promise<
		MutationResult<{
			setStoreBookCollectionName: UpdateResponse<StoreBookCollectionNameResource2>
		}>
	> {
		return this.apollo
			.mutate<{
				setStoreBookCollectionName: UpdateResponse<StoreBookCollectionNameResource2>
			}>({
				mutation: gql`
					mutation SetStoreBookCollectionName($uuid: String!, $name: String!, $language: String!) {
						setStoreBookCollectionName(uuid: $uuid, name: $name, language: $language) {
							${queryData}
						}
					}
				`,
				variables
			})
			.toPromise()
	}

	retrieveStoreBookSeries(
		queryData: string,
		variables: { uuid: string; languages?: string[] }
	): Promise<
		ApolloQueryResult<{ retrieveStoreBookSeries: StoreBookSeriesResource2 }>
	> {
		return this.apollo
			.query<{ retrieveStoreBookSeries: StoreBookSeriesResource2 }>({
				query: gql`
					query RetrieveStoreBookSeries($uuid: String!, languages: [String!]) {
						retrieveStoreBookSeries(uuid: $uuid, languages: $languages) {
							${queryData}
						}
					}
				`,
				variables
			})
			.toPromise()
	}

	listStoreBookSeries(
		queryData: string,
		variables?: {
			latest?: boolean
			languages?: string[]
			limit?: number
			offset?: number
		}
	): Promise<
		ApolloQueryResult<{ listStoreBookSeries: List<StoreBookSeriesResource2> }>
	> {
		return this.apollo
			.query<{
				listStoreBookSeries: List<StoreBookSeriesResource2>
			}>({
				query: gql`
					query ListStoreBookSeries($latest: Boolean, $languages, [String!], limit: Int, offset: Int) {
						listStoreBookSeries(latest: $latest, languages: $languages, limit: $limit, offset: $offset) {
							${queryData}
						}
					}
				`,
				variables
			})
			.toPromise()
	}

	retrieveStoreBook(
		queryData: string,
		variables: { uuid: string }
	): Promise<ApolloQueryResult<{ retrieveStoreBook: StoreBookResource2 }>> {
		return this.apollo
			.query<{
				retrieveStoreBook: StoreBookResource2
			}>({
				query: gql`
					query RetrieveStoreBook($uuid: String!) {
						retrieveStoreBook(uuid: $uuid) {
							${queryData}
						}
					}
				`,
				variables
			})
			.toPromise()
	}

	listStoreBooks(
		queryData: string,
		variables?: {
			latest?: boolean
			categories?: string[]
			inReview?: boolean
			languages?: string[]
			limit?: number
			offset?: number
		}
	): Promise<ApolloQueryResult<{ listStoreBooks: List<StoreBookResource2> }>> {
		return this.apollo
			.query<{
				listStoreBooks: List<StoreBookResource2>
			}>({
				query: gql`
					query ListStoreBooks(
						$latest: Boolean
						$categories: [String!]
						$limit: Int
						$latest: Boolean
					) {
						listStoreBooks(
							latest: $latest
							categories: $categories
							limit: $limit
							offset: $offset
						) {
							${queryData}
						}
					}
				`,
				variables
			})
			.toPromise()
	}

	listCategories(
		queryData: string,
		variables?: { languages?: string[] }
	): Promise<ApolloQueryResult<{ listCategories: List<CategoryResource2> }>> {
		return this.apollo
			.query<{
				listCategories: List<CategoryResource2>
			}>({
				query: gql`
					query ListCategories($languages: [String!]) {
						listCategories(languages: $languages) {
							${queryData}
						}
					}
				`,
				variables
			})
			.toPromise()
	}

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
