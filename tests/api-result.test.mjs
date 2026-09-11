import assert from "node:assert/strict"
import { test } from "node:test"
import { CombinedGraphQLErrors } from "@apollo/client/errors"
import { toApiResult } from "../src/app/misc/api-result.ts"

test("successful responses retain their data without reporting errors", () => {
	const data = { listOrders: { items: [] } }
	assert.deepEqual(toApiResult({ data }), { data, errors: undefined })
})

test("GraphQL errors preserve session and validation extensions with partial data", () => {
	const errors = [
		{ message: "Session expired", extensions: { code: "sessionExpired" } },
		{ message: "Invalid name", extensions: { errors: ["nameTooShort"] } }
	]
	const data = { retrieveAuthor: null }
	const result = toApiResult({ data, error: new CombinedGraphQLErrors({ data, errors }) })
	assert.equal(result.data, data)
	assert.deepEqual(result.errors, errors)
})

test("GraphQL failures without data remain errors", () => {
	const errors = [{ message: "Forbidden", extensions: { code: "forbidden" } }]
	assert.deepEqual(toApiResult({ error: new CombinedGraphQLErrors({ errors }) }), {
		data: undefined,
		errors
	})
})

test("network failures reject rather than being treated as successful responses", () => {
	const error = new Error("Connection refused")
	assert.throws(() => toApiResult({ error }), thrown => thrown === error)
})
