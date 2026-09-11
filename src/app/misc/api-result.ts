import { CombinedGraphQLErrors } from "@apollo/client/errors"
import type { ErrorLike } from "@apollo/client"
import type { GraphQLFormattedError } from "graphql"

export interface ApiResult<T> {
	data?: T | null
	errors?: readonly GraphQLFormattedError[]
}

// Keep the service API stable across Apollo 4's unified error handling.
// GraphQL errors remain available to validation and session renewal callers;
// transport errors still reject the request instead of looking like success.
export function toApiResult<T>(result: {
	data?: T | null
	error?: ErrorLike
}): ApiResult<T> {
	if (result.error && !CombinedGraphQLErrors.is(result.error)) {
		throw result.error
	}

	return {
		data: result.data,
		errors: CombinedGraphQLErrors.is(result.error)
			? result.error.errors
			: undefined
	}
}
