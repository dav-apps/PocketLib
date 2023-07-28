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
	PublisherResource2,
	AuthorResource2,
	AuthorBioResource2,
	StoreBookCollectionResource2,
	StoreBookCollectionNameResource2,
	StoreBookSeriesResource2,
	StoreBookResource2,
	StoreBookReleaseResource2,
	CategoryResource2,
	BookResource2
} from "../misc/types"
import { CachingService } from "./caching-service"

@Injectable()
export class GraphQLService {
	constructor(
		private cachingService: CachingService,
		private apollo: Apollo
	) {}

	//#region Publisher
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

	createPublisher(
		queryData: string,
		variables: {
			name: string
		}
	): Promise<MutationResult<{ createPublisher: PublisherResource2 }>> {
		return this.apollo
			.mutate<{ createPublisher: PublisherResource2 }>({
				mutation: gql`
					mutation CreatePublisher($name: String!) {
						createPublisher(name: $name) {
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
	//#endregion

	//#region Author
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

	createAuthor(
		queryData: string,
		variables: {
			publisher?: string
			firstName: string
			lastName: string
		}
	): Promise<MutationResult<{ createAuthor: AuthorResource2 }>> {
		return this.apollo
			.mutate<{
				createAuthor: AuthorResource2
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
	): Promise<MutationResult<{ updateAuthor: AuthorResource2 }>> {
		return this.apollo
			.mutate<{
				updateAuthor: AuthorResource2
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
	//#endregion

	//#region AuthorBio
	setAuthorBio(
		queryData: string,
		variables: { uuid: string; bio: string; language: string }
	): Promise<MutationResult<{ setAuthorBio: AuthorBioResource2 }>> {
		return this.apollo
			.mutate<{ setAuthorBio: AuthorBioResource2 }>({
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
	//#endregion

	//#region StoreBookCollection
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
	//#endregion

	//#region StoreBookCollectionName
	setStoreBookCollectionName(
		queryData: string,
		variables: { uuid: string; name: string; language: string }
	): Promise<
		MutationResult<{
			setStoreBookCollectionName: StoreBookCollectionNameResource2
		}>
	> {
		return this.apollo
			.mutate<{
				setStoreBookCollectionName: StoreBookCollectionNameResource2
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
	//#endregion

	//#region StoreBookSeries
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

	createStoreBookSeries(
		queryData: string,
		variables: {
			author?: string
			name: string
			language: string
			storeBooks?: string[]
		}
	): Promise<
		MutationResult<{ createStoreBookSeries: StoreBookSeriesResource2 }>
	> {
		return this.apollo
			.mutate<{ createStoreBookSeries: StoreBookSeriesResource2 }>({
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
				variables
			})
			.toPromise()
	}

	updateStoreBookSeries(
		queryData: string,
		variables: {
			uuid: string
			name?: string
			storeBooks?: string[]
		}
	): Promise<
		MutationResult<{ updateStoreBookSeries: StoreBookSeriesResource2 }>
	> {
		return this.apollo
			.mutate<{
				updateStoreBookSeries: StoreBookSeriesResource2
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
				variables
			})
			.toPromise()
	}
	//#endregion

	//#region StoreBook
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

	createStoreBook(
		queryData: string,
		variables: {
			author?: string
			collection?: string
			title: string
			description?: string
			language: string
			price?: number
			isbn?: string
			categories?: string[]
		}
	): Promise<MutationResult<{ createStoreBook: StoreBookResource2 }>> {
		return this.apollo
			.mutate<{
				createStoreBook: StoreBookResource2
			}>({
				mutation: gql`
					mutation CreateStoreBook(
						$author: String
						$collection: String
						$title: String!
						$description: String
						$language: String!
						$price: Int
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
							isbn: $isbn
							categories: $categories
						) {
							${queryData}
						}
					}
				`,
				variables
			})
			.toPromise()
	}

	updateStoreBook(
		queryData: string,
		variables: {
			uuid: string
			title?: string
			description?: string
			language?: string
			price?: number
			isbn?: string
			status?: string
			categories?: string[]
		}
	): Promise<MutationResult<{ updateStoreBook: StoreBookResource2 }>> {
		return this.apollo
			.mutate<{
				updateStoreBook: StoreBookResource2
			}>({
				mutation: gql`
					mutation UpdateStoreBook(
						$uuid: String!
						$title: String
						$description: String
						$language: String
						$price: Int
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
							isbn: $isbn
							status: $status
							categories: $categories
						) {
							${queryData}
						}
					}
				`,
				variables
			})
			.toPromise()
	}
	//#endregion

	//#region StoreBookRelease
	publishStoreBookRelease(
		queryData: string,
		variables: {
			uuid: string
			releaseName: string
			releaseNotes?: string
		}
	): Promise<
		MutationResult<{ publishStoreBookRelease: StoreBookReleaseResource2 }>
	> {
		return this.apollo
			.mutate<{
				publishStoreBookRelease: StoreBookReleaseResource2
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
							releaseNote: $releaseNotes
						) {
							${queryData}
						}
					}
				`,
				variables
			})
			.toPromise()
	}
	//#endregion

	//#region Category
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
	//#endregion

	//#region Book
	createBook(
		queryData: string,
		variables: {
			storeBook: string
		}
	): Promise<MutationResult<{ createBook: BookResource2 }>> {
		return this.apollo
			.mutate<{ createBook: BookResource2 }>({
				mutation: gql`
					mutation CreateBook($storeBook: String!) {
						createBook(storeBook: $storeBook) {
							${queryData}
						}
					}
				`,
				variables
			})
			.toPromise()
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
