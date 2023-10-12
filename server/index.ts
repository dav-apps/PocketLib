import * as path from "path"
import * as fs from "fs"
import { JSDOM } from "jsdom"
import { request, gql } from "graphql-request"

let backendUrl = "http://localhost:4001"
let websiteUrl = "http://localhost:3001"

switch (process.env.ENV) {
	case "production":
		backendUrl = "https://dav-backend-tfpik.ondigitalocean.app/v1"
		websiteUrl = "https://pocketlib.app/"
		break
	case "staging":
		backendUrl = "https://dav-backend-tfpik.ondigitalocean.app/staging/v1"
		websiteUrl = "https://pocketlib-staging-d9rk6.ondigitalocean.app/"
		break
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
