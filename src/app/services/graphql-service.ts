import { Injectable } from "@angular/core"
import { Apollo, gql } from "apollo-angular"

@Injectable()
export class GraphQLService {
	constructor(private apollo: Apollo) {}

	retrievePublisher(queryData: string, variables: { uuid: string }) {
		return this.apollo
			.query<{
				retrievePublisher: any
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

	retrieveAuthor(queryData: string, variables: { uuid: string }) {
		return this.apollo
			.query<{
				retrieveAuthor: any
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
		variables: { limit?: number; latest?: boolean }
	) {
		return this.apollo
			.query<{
				listAuthors: any
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

	retrieveStoreBook(queryData: string, variables: { uuid: string }) {
		return this.apollo
			.query<{
				retrieveStoreBook: any
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

	listCategories(queryData: string, variables: { language?: string }) {
		return this.apollo
			.query<{
				listCategories: any[]
			}>({
				query: gql`
					query ListCategories($language: String) {
						listCategories(language: $language) {
							${queryData}
						}
					}
				`,
				variables
			})
			.toPromise()
	}
}
