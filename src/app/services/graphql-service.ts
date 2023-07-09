import { Injectable } from "@angular/core"
import { Apollo, gql } from "apollo-angular"

@Injectable()
export class GraphQLService {
	constructor(private apollo: Apollo) {}

	listAuthors(params: { limit?: number; latest?: boolean }) {
		return this.apollo
			.query<{
				listAuthors: {
					uuid: string
					firstName: string
					lastName: string
					profileImage: { url: string; blurhash: string }
				}[]
			}>({
				query: gql`
					query ListAuthors($limit: Int, $latest: Boolean) {
						listAuthors(limit: $limit, latest: $latest) {
							uuid
							firstName
							lastName
							profileImage {
								url
								blurhash
							}
						}
					}
				`,
				variables: {
					limit: params.limit,
					latest: params.latest
				}
			})
			.toPromise()
	}

	listCategories(params: { language?: string }) {
		return this.apollo
			.query<{
				listCategories: {
					uuid: string
					key: string
					name: {
						name: string
						language: string
					}
				}[]
			}>({
				query: gql`
					query ListCategories($language: String) {
						listCategories(language: $language) {
							uuid
							key
							name {
								name
								language
							}
						}
					}
				`,
				variables: {
					language: params.language
				}
			})
			.toPromise()
	}
}
