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

	retrieveStoreBook(uuid: string) {
		return this.apollo
			.query<{
				retrieveStoreBook: {
					uuid: string
					collection: {
						uuid: string
						author: {
							uuid: string
							publisher: {
								uuid: string
								name: string
								logo: {
									url: string
									blurhash: string
								}
							}
							firstName: string
							lastName: string
							profileImage: {
								url: string
							}
						}
					}
					title: string
					description: string
					price: number
					status: string
					cover: {
						url: string
						blurhash: string
					}
					inLibrary: boolean
					purchased: boolean
					categories: {
						key: string
					}[]
					series: { uuid: string }[]
				}
			}>({
				query: gql`
					query RetrieveStoreBook($uuid: String!) {
						retrieveStoreBook(uuid: $uuid) {
							uuid
							collection {
								uuid
								author {
									uuid
									publisher {
										uuid
										name
										logo {
											url
											blurhash
										}
									}
									firstName
									lastName
									profileImage {
										url
									}
								}
							}
							title
							description
							price
							status
							cover {
								url
								blurhash
							}
							inLibrary
							purchased
							categories {
								key
							}
							series {
								uuid
							}
						}
					}
				`,
				variables: {
					uuid
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
