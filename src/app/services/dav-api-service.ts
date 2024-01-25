import { Injectable } from "@angular/core"
import { Apollo, ApolloBase, gql } from "apollo-angular"
import { ApolloQueryResult, ErrorPolicy } from "@apollo/client/core"
import { renewSession } from "dav-js"
import { davApiClientName } from "src/constants/constants"
import * as ErrorCodes from "src/constants/errorCodes"
import { List, Order } from "../misc/types"

const errorPolicy: ErrorPolicy = "all"

@Injectable()
export class DavApiService {
	private apollo: ApolloBase

	constructor(private apolloProvider: Apollo) {
		this.loadApolloClient()
	}

	loadApolloClient() {
		this.apollo = this.apolloProvider.use(davApiClientName)
	}

	//#region Order
	async listOrders(
		queryData: string,
		variables?: { limit?: number; offset?: number }
	): Promise<ApolloQueryResult<{ listOrders: List<Order> }>> {
		let result = await this.apollo
			.query<{ listOrders: List<Order> }>({
				query: gql`
					query ListOrders($limit: Int, $offset: Int) {
						listOrders(limit: $limit, offset: $offset) {
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

			return await this.listOrders(queryData, variables)
		}

		return result
	}
	//#endregion
}
