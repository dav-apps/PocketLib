import { request, gql } from "graphql-request"

let sitemap: string = null
let backendUrl = "http://localhost:4001"
let websiteUrl = "http://localhost:3001"

switch (process.env.ENV) {
	case "production":
		backendUrl = "https://pocketlib-api-bdb2i.ondigitalocean.app/"
		websiteUrl = "https://pocketlib.app"
		break
	case "staging":
		backendUrl = "https://pocketlib-api-staging-rl8zc.ondigitalocean.app/"
		websiteUrl = "https://pocketlib-staging-oo6cn.ondigitalocean.app"
		break
}

export async function generateSitemap(): Promise<string> {
	if (sitemap != null) {
		return sitemap
	}

	let result = ""

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
	try {
		let response = await request<{
			listVlbAuthors?: { items: { slug: string }[] }
		}>(
			backendUrl,
			gql`
				query ListVlbAuthors {
					listVlbAuthors(limit: 10000) {
						items {
							slug
						}
					}
				}
			`
		)

		let vlbAuthorItems = response.listVlbAuthors?.items

		if (vlbAuthorItems != null) {
			for (let item of vlbAuthorItems) {
				result += `${websiteUrl}/store/author/${item.slug}\n`
			}
		}
	} catch (error) {
		console.error(error)
	}

	// StoreBooks
	try {
		let response = await request<{
			listStoreBooks?: { items: { slug: string }[] }
		}>(
			backendUrl,
			gql`
				query ListStoreBooks {
					listStoreBooks(limit: 10000) {
						items {
							slug
						}
					}
				}
			`
		)

		let storeBookItems = response.listStoreBooks?.items

		if (storeBookItems != null) {
			for (let item of storeBookItems) {
				result += `${websiteUrl}/store/book/${item.slug}\n`
			}
		}
	} catch (error) {
		console.error(error)
	}

	// VlbItems
	try {
		let response = await request<{
			listVlbItems?: { items: { slug: string }[] }
		}>(
			backendUrl,
			gql`
				query ListVlbItems {
					listVlbItems(limit: 10000) {
						items {
							slug
						}
					}
				}
			`
		)

		let vlbItems = response.listVlbItems?.items

		if (vlbItems != null) {
			for (let item of vlbItems) {
				result += `${websiteUrl}/store/book/${item.slug}\n`
			}
		}
	} catch (error) {
		console.error(error)
	}

	sitemap = result
	return result
}
