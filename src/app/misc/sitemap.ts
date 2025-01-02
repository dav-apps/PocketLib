import fs from "fs"
import { request, gql } from "graphql-request"

let backendUrl = "https://pocketlib-api-bdb2i.ondigitalocean.app/"
let websiteUrl = "https://pocketlib.app"

if (process.env.ENV == "staging") {
	backendUrl = "https://pocketlib-api-staging-rl8zc.ondigitalocean.app/"
	websiteUrl = "https://pocketlib-staging-oo6cn.ondigitalocean.app"
}

generateSitemap()

async function generateSitemap() {
	let result = ""
	const itemsLimit = 500

	// Base urls
	result += `${websiteUrl}\n`
	result += `${websiteUrl}/store\n`

	// Publishers
	try {
		let response = await request<{
			listPublishers?: { items: { slug: string }[] }
		}>(
			backendUrl,
			gql`
				query ListPublishers {
					listPublishers(limit: 10000) {
						items {
							slug
						}
					}
				}
			`
		)

		let publisherItems = response.listPublishers?.items

		if (publisherItems != null) {
			for (let item of publisherItems) {
				result += `${websiteUrl}/store/publisher/${item.slug}\n`
			}
		}
	} catch (error) {
		console.error(error)
	}

	// Authors
	try {
		let response = await request<{
			listAuthors?: { items: { slug: string }[] }
		}>(
			backendUrl,
			gql`
				query ListAuthors {
					listAuthors(limit: 10000) {
						items {
							slug
						}
					}
				}
			`
		)

		let authorItems = response.listAuthors?.items

		if (authorItems != null) {
			for (let item of authorItems) {
				result += `${websiteUrl}/store/author/${item.slug}\n`
			}
		}
	} catch (error) {
		console.error(error)
	}

	// VlbAuthors
	let vlbAuthorsTotalItems = 0
	let vlbAuthorsOffset = 0

	try {
		do {
			let response = await request<{
				listVlbAuthors?: { total: number; items: { slug: string }[] }
			}>(
				backendUrl,
				gql`
					query ListVlbAuthors($limit: Int, $offset: Int) {
						listVlbAuthors(limit: $limit, offset: $offset) {
							total
							items {
								slug
							}
						}
					}
				`,
				{
					limit: itemsLimit,
					offset: vlbAuthorsOffset
				}
			)

			let vlbAuthorItems = response.listVlbAuthors?.items

			if (vlbAuthorItems != null) {
				vlbAuthorsTotalItems = response.listVlbAuthors?.total
				vlbAuthorsOffset += itemsLimit

				for (let item of vlbAuthorItems) {
					result += `${websiteUrl}/store/author/${item.slug}\n`
				}
			}
		} while (vlbAuthorsOffset < vlbAuthorsTotalItems)
	} catch (error) {
		console.error(error)
	}

	// StoreBooks
	let storeBooksTotalItems = 0
	let storeBooksOffset = 0

	try {
		do {
			let response = await request<{
				listStoreBooks?: { total: number; items: { slug: string }[] }
			}>(
				backendUrl,
				gql`
					query ListStoreBooks($limit: Int, $offset: Int) {
						listStoreBooks(limit: $limit, offset: $offset) {
							total
							items {
								slug
							}
						}
					}
				`,
				{
					limit: itemsLimit,
					offset: storeBooksOffset
				}
			)

			let storeBookItems = response.listStoreBooks?.items

			if (storeBookItems != null) {
				storeBooksTotalItems = response.listStoreBooks?.total
				storeBooksOffset += itemsLimit

				for (let item of storeBookItems) {
					result += `${websiteUrl}/store/book/${item.slug}\n`
				}
			}
		} while (storeBooksOffset < storeBooksTotalItems)
	} catch (error) {
		console.error(error)
	}

	// VlbItems
	let vlbItemsTotalItems = 0
	let vlbItemsOffset = 0

	try {
		do {
			let response = await request<{
				listVlbItems?: { total: number; items: { slug: string }[] }
			}>(
				backendUrl,
				gql`
					query ListVlbItems($limit: Int, $offset: Int) {
						listVlbItems(limit: $limit, offset: $offset) {
							total
							items {
								slug
							}
						}
					}
				`,
				{
					limit: itemsLimit,
					offset: vlbItemsOffset
				}
			)

			let vlbItems = response.listVlbItems?.items

			if (vlbItems != null) {
				vlbItemsTotalItems = response.listVlbItems?.total
				vlbItemsOffset += itemsLimit

				for (let item of vlbItems) {
					result += `${websiteUrl}/store/book/${item.slug}\n`
				}
			}
		} while (vlbItemsOffset < vlbItemsTotalItems)
	} catch (error) {
		console.error(error)
	}

	fs.writeFileSync("./src/sitemap.txt", result)
}
