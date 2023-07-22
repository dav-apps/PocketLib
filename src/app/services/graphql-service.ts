import { Injectable } from "@angular/core"
import { Apollo, gql } from "apollo-angular"
import { ApolloQueryResult } from "@apollo/client/core"
import {
	List,
	PublisherResource2,
	AuthorResource2,
	CategoryResource2,
	StoreBookSeriesResource2,
	StoreBookResource2,
	StoreBookCollectionResource2
} from "../misc/types"

@Injectable()
export class GraphQLService {
	constructor(private apollo: Apollo) {}

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
}
