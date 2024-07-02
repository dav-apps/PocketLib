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
		backendUrl = "https://pocketlib-api-staging-aeksy.ondigitalocean.app/"
		websiteUrl = "https://pocketlib-staging-d9rk6.ondigitalocean.app"
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
			listPublishers: { items: { uuid: string }[] }
		}>(
			backendUrl,
			gql`
				query ListPublishers {
					listPublishers(limit: 10000) {
						items {
							uuid
						}
					}
				}
			`,
			{}
		)

		let publisherItems = response.listPublishers.items

		for (let item of publisherItems) {
			result += `${websiteUrl}/store/publisher/${item.uuid}\n`
		}
	} catch (error) {
		console.error(error)
	}

	// Authors
	try {
		let response = await request<{
			listAuthors: { items: { uuid: string }[] }
		}>(
			backendUrl,
			gql`
				query ListAuthors {
					listAuthors(limit: 10000) {
						items {
							uuid
						}
					}
				}
			`,
			{}
		)

		let authorItems = response.listAuthors.items

		for (let item of authorItems) {
			result += `${websiteUrl}/store/author/${item.uuid}\n`
		}
	} catch (error) {
		console.error(error)
	}

	// StoreBooks
	try {
		let response = await request<{
			listStoreBooks: { items: { uuid: string }[] }
		}>(
			backendUrl,
			gql`
				query ListStoreBooks {
					listStoreBooks(limit: 10000) {
						items {
							uuid
						}
					}
				}
			`,
			{}
		)

		let storeBookItems = response.listStoreBooks.items

		for (let item of storeBookItems) {
			result += `${websiteUrl}/store/book/${item.uuid}\n`
		}
	} catch (error) {
		console.error(error)
	}

	sitemap = result
	return result
}

export async function PrepareStoreBookPage(uuid: string): Promise<string> {
	try {
		let response = await request<{
			retrieveStoreBook: {
				title: string
				description: string
				cover?: { url: string }
			}
		}>(
			backendUrl,
			gql`
				query RetrieveStoreBook($uuid: String!) {
					retrieveStoreBook(uuid: $uuid) {
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

		let responseData = response.retrieveStoreBook

		return getHtml({
			title: responseData.title,
			description: responseData.description,
			imageUrl: responseData.cover?.url,
			url: `${websiteUrl}/store/book/${uuid}`
		})
	} catch (error) {
		console.error(error)
		return getHtml()
	}
}

export async function PrepareStoreAuthorPage(uuid: string) {
	try {
		let response = await request<{
			retrieveAuthor: {
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

		let responseData = response.retrieveAuthor

		return getHtml({
			title: `${responseData.firstName} ${responseData.lastName}`,
			description: responseData.bio?.bio,
			imageUrl: responseData.profileImage?.url,
			url: `${websiteUrl}/store/author/${uuid}`
		})
	} catch (error) {
		console.error(error)
		return getHtml()
	}
}

export async function PrepareStorePublisherPage(uuid: string) {
	try {
		let response = await request<{
			retrievePublisher: {
				name: string
				description: string
				logo?: { url: string }
			}
		}>(
			backendUrl,
			gql`
				query RetrievePublisher($uuid: String!) {
					retrievePublisher(uuid: $uuid) {
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

		let responseData = response.retrievePublisher

		return getHtml({
			title: responseData.name,
			description: responseData.description,
			imageUrl: responseData.logo?.url,
			url: `${websiteUrl}/store/publisher/${uuid}`
		})
	} catch (error) {
		console.error(error)
		return getHtml()
	}
}

function getHtml(params?: {
	title: string
	description: string
	imageUrl: string
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
			{ name: "twitter:description", content: params.description },
			{ name: "twitter:image", content: params.imageUrl },
			// Open Graph tags
			{ property: "og:title", content: params.title },
			{ property: "og:image", content: params.imageUrl },
			{ property: "og:url", content: params.url }
		]

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

		return html.outerHTML
	}

	return index
}
