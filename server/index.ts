import * as path from "path"
import * as fs from "fs"
import { JSDOM } from "jsdom"
import { request, gql } from "graphql-request"

let sitemap: string = null
let backendUrl = "http://localhost:4001"
let websiteUrl = "http://localhost:3001"

switch (process.env.ENV) {
	case "production":
		backendUrl = "https://pocketlib-api-dj7q2.ondigitalocean.app/"
		websiteUrl = "https://pocketlib.app"
		break
	case "staging":
		backendUrl = "https://pocketlib-api-staging-rl8zc.ondigitalocean.app/"
		websiteUrl = "https://pocketlib-staging-oo6cn.ondigitalocean.app"
		break
}

interface PageResult {
	html: string
	status: number
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
			listPublishers: { items: { slug: string }[] }
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
			`,
			{}
		)

		let publisherItems = response.listPublishers.items

		for (let item of publisherItems) {
			result += `${websiteUrl}/store/publisher/${item.slug}\n`
		}
	} catch (error) {
		console.error(error)
	}

	// Authors
	try {
		let response = await request<{
			listAuthors: { items: { slug: string }[] }
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
			`,
			{}
		)

		let authorItems = response.listAuthors.items

		for (let item of authorItems) {
			result += `${websiteUrl}/store/author/${item.slug}\n`
		}
	} catch (error) {
		console.error(error)
	}

	// StoreBooks
	try {
		let response = await request<{
			listStoreBooks: { items: { slug: string }[] }
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
			`,
			{}
		)

		let storeBookItems = response.listStoreBooks.items

		for (let item of storeBookItems) {
			result += `${websiteUrl}/store/book/${item.slug}\n`
		}
	} catch (error) {
		console.error(error)
	}

	sitemap = result
	return result
}

export async function prepareStoreBookPage(uuid: string): Promise<PageResult> {
	try {
		let storeBookResponse = await request<{
			retrieveStoreBook: {
				slug: string
				title: string
				description: string
				cover?: { url: string }
			}
		}>(
			backendUrl,
			gql`
				query RetrieveStoreBook($uuid: String!) {
					retrieveStoreBook(uuid: $uuid) {
						slug
						title
						description
						cover {
							url
						}
					}
				}
			`,
			{ uuid }
		)

		let storeBookResponseData = storeBookResponse.retrieveStoreBook

		if (storeBookResponseData != null) {
			return {
				html: getHtml({
					title: storeBookResponseData.title,
					description: storeBookResponseData.description,
					imageUrl: storeBookResponseData.cover?.url,
					url: `${websiteUrl}/store/book/${storeBookResponseData.slug}`
				}),
				status: 200
			}
		}

		let vlbItemResponse = await request<{
			retrieveVlbItem: {
				slug: string
				title: string
				description: string
				coverUrl: string
			}
		}>(
			backendUrl,
			gql`
				query RetrieveVlbItem($uuid: String!) {
					retrieveVlbItem(uuid: $uuid) {
						uuid
						title
						description
						coverUrl
					}
				}
			`,
			{ uuid }
		)

		let vlbItemResponseData = vlbItemResponse.retrieveVlbItem

		if (vlbItemResponseData != null) {
			return {
				html: getHtml({
					title: vlbItemResponseData.title,
					description: vlbItemResponseData.description,
					imageUrl: vlbItemResponseData.coverUrl,
					url: `${websiteUrl}/store/book/${vlbItemResponseData.slug}`
				}),
				status: 200
			}
		}
	} catch (error) {
		console.error(error)
	}

	return {
		html: getHtml(),
		status: 404
	}
}

export async function prepareStoreAuthorPage(
	uuid: string
): Promise<PageResult> {
	try {
		let authorResponse = await request<{
			retrieveAuthor: {
				slug: string
				firstName: string
				lastName: string
				bio?: { bio: string }
				profileImage?: { url: string }
			}
		}>(
			backendUrl,
			gql`
				query RetrieveAuthor($uuid: String!) {
					retrieveAuthor(uuid: $uuid) {
						slug
						firstName
						lastName
						bio {
							bio
						}
						profileImage {
							url
						}
					}
				}
			`,
			{ uuid }
		)

		let authorResponseData = authorResponse.retrieveAuthor

		if (authorResponseData != null) {
			return {
				html: getHtml({
					title: `${authorResponseData.firstName} ${authorResponseData.lastName}`,
					description: authorResponseData.bio?.bio,
					imageUrl: authorResponseData.profileImage?.url,
					url: `${websiteUrl}/store/author/${authorResponseData.slug}`
				}),
				status: 200
			}
		}

		let vlbAuthorResponse = await request<{
			retrieveVlbAuthor: {
				slug: string
				firstName: string
				lastName: string
				bio: string
			}
		}>(
			backendUrl,
			gql`
				query RetrieveVlbAuthor($uuid: String!) {
					retrieveVlbAuthor(uuid: $uuid) {
						slug
						firstName
						lastName
						bio
					}
				}
			`,
			{ uuid }
		)

		let vlbAuthorResponseData = vlbAuthorResponse.retrieveVlbAuthor

		if (vlbAuthorResponseData != null) {
			return {
				html: getHtml({
					title: `${vlbAuthorResponseData.firstName} ${vlbAuthorResponseData.lastName}`,
					description: vlbAuthorResponseData.bio,
					url: `${websiteUrl}/store/author/${vlbAuthorResponseData.slug}`
				}),
				status: 200
			}
		}
	} catch (error) {
		console.error(error)
	}

	return {
		html: getHtml(),
		status: 404
	}
}

export async function prepareStorePublisherPage(
	uuid: string
): Promise<PageResult> {
	try {
		let publisherResponse = await request<{
			retrievePublisher: {
				slug: string
				name: string
				description: string
				logo?: { url: string }
			}
		}>(
			backendUrl,
			gql`
				query RetrievePublisher($uuid: String!) {
					retrievePublisher(uuid: $uuid) {
						slug
						name
						description
						logo {
							url
						}
					}
				}
			`,
			{ uuid }
		)

		let publisherResponseData = publisherResponse.retrievePublisher

		if (publisherResponseData != null) {
			return {
				html: getHtml({
					title: publisherResponseData.name,
					description: publisherResponseData.description,
					imageUrl: publisherResponseData.logo?.url,
					url: `${websiteUrl}/store/publisher/${publisherResponseData.slug}`
				}),
				status: 200
			}
		}

		let vlbPublisherResponse = await request<{
			retrieveVlbPublisher: {
				id: string
				name: string
				url: string
			}
		}>(
			backendUrl,
			gql`
				query RetrieveVlbPublisher($id: String!) {
					retrieveVlbPublisher(id: $id) {
						name
					}
				}
			`,
			{ id: uuid }
		)

		let vlbPublisherResponseData = vlbPublisherResponse.retrieveVlbPublisher

		if (vlbPublisherResponseData != null) {
			return {
				html: getHtml({
					title: vlbPublisherResponseData.name,
					description: "",
					url: `${websiteUrl}/store/publisher/${uuid}`
				}),
				status: 200
			}
		}
	} catch (error) {
		console.error(error)
	}

	return {
		html: getHtml(),
		status: 404
	}
}

function getHtml(params?: {
	title: string
	description?: string
	imageUrl?: string
	url: string
	book?: {
		author: {
			firstName: string
			lastName: string
		}
	}
}): string {
	// Read the html file
	let index = fs.readFileSync(path.resolve("./PocketLib/index.html"), {
		encoding: "utf8"
	})

	if (params) {
		const dom = new JSDOM(index)
		let html = dom.window.document.querySelector("html")
		let head = html.querySelector("head")

		let metas: { name?: string; property?: string; content: string }[] = [
			// Twitter tags
			{ name: "twitter:card", content: "summary" },
			{ name: "twitter:site", content: "@dav_apps" },
			{ name: "twitter:title", content: params.title },
			// Open Graph tags
			{ property: "og:title", content: params.title },
			{ property: "og:url", content: params.url }
		]

		if (params.description != null) {
			metas.push(
				{
					name: "description",
					content: params.description
				},
				{
					name: "twitter:description",
					content: params.description
				}
			)
		}

		if (params.imageUrl != null) {
			metas.push(
				{
					name: "twitter:image",
					content: params.imageUrl
				},
				{
					property: "og:image",
					content: params.imageUrl
				}
			)
		}

		if (params.book) {
			// Open Graph book tags
			metas.push(
				{ property: "og:type", content: "book" },
				{
					property: "og:book:author:first_name",
					content: params.book.author.firstName
				},
				{
					property: "og:book:author:last_name",
					content: params.book.author.lastName
				}
			)
		} else {
			metas.push({ property: "og:type", content: "website" })
		}

		for (let metaObj of metas) {
			if (metaObj.content == null) continue

			// Check if a meta tag with the name or property already exists
			let meta: any

			if (metaObj.name != null) {
				meta = dom.window.document.querySelector(
					`meta[name='${metaObj.name}']`
				)
			} else if (metaObj.property != null) {
				meta = dom.window.document.querySelector(
					`meta[property='${metaObj.property}']`
				)
			}

			if (meta == null) {
				meta = dom.window.document.createElement("meta")

				if (metaObj.name != null) {
					meta.setAttribute("name", metaObj.name)
				} else if (metaObj.property != null) {
					meta.setAttribute("property", metaObj.property)
				}

				meta.setAttribute("content", metaObj.content)
				head.appendChild(meta)
			} else {
				meta.setAttribute("content", metaObj.content)
			}
		}

		// Set canonical link tag
		let link = dom.window.document.createElement("link")
		link.setAttribute("rel", "canonical")
		link.setAttribute("href", params.url)
		head.appendChild(link)

		return html.outerHTML
	}

	return index
}
