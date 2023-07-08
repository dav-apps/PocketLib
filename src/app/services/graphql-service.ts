import { Injectable } from "@angular/core"
import { Apollo, gql } from "apollo-angular"

@Injectable()
export class GraphQLService {
	constructor(private apollo: Apollo) {}

	listCategories(language?: string) {
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
					language
				}
			})
			.toPromise()
	}
}
