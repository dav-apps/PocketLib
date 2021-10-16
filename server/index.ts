import * as path from 'path'
import * as fs from 'fs'
import { JSDOM } from 'jsdom'
import axios from 'axios'

const backendUrl = process.env.ENV == "production" ? `https://dav-backend.herokuapp.com/v1` : `http://localhost:3111/v1`
const websiteUrl = process.env.ENV == "production" ? `https://pocketlib.dav-apps.tech` : `http://localhost:3001`

export async function PrepareStoreBookPage(uuid: string): Promise<string> {
	try {
		let response = await axios({
			method: 'get',
			url: `${backendUrl}/api/1/call/store/book/${uuid}`
		})
		let responseData = response.data as any

		if (response.status == 200) {
			// Add the appropriate meta tags to the html
			return getHtml({
				title: responseData.title,
				description: responseData.description,
				imageUrl: `${backendUrl}/api/1/call/store/book/${uuid}/cover`,
				url: `${websiteUrl}/store/book/${uuid}`
			})
		}
	} catch (error) { }

	return getHtml()
}

export async function PrepareStoreAuthorPage(uuid: string) {
	try {
		let response = await axios({
			method: 'get',
			url: `${backendUrl}/api/1/call/author/${uuid}`
		})
		let responseData = response.data as any

		if (response.status == 200) {
			return getHtml({
				title: `${responseData.first_name} ${responseData.last_name}`,
				description: responseData.bios.length > 0 ? responseData.bios[0].bio : "",
				imageUrl: `${backendUrl}/api/1/call/author/${uuid}/profile_image`,
				url: `${websiteUrl}/store/author/${uuid}`
			})
		}
	} catch (error) { }

	return getHtml()
}

function getHtml(params?: {
	title: string,
	description: string,
	imageUrl: string,
	url: string,
	book?: {
		author: {
			firstName: string,
			lastName: string
		}
	}
}): string {
	// Read the html file
	let index = fs.readFileSync(path.resolve('./PocketLib/index.html'), { encoding: 'utf8' })

	if (params) {
		const dom = new JSDOM(index)
		let html = dom.window.document.querySelector('html')
		let head = html.querySelector('head')

		let metas: { name?: string, property?: string, content: string }[] = [
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
				{ property: "og:book:author:first_name", content: params.book.author.firstName },
				{ property: "og:book:author:last_name", content: params.book.author.lastName }
			)
		} else {
			metas.push(
				{ property: "og:type", content: "website" }
			)
		}

		for (let metaObj of metas) {
			let meta = dom.window.document.createElement('meta')
			if (metaObj.name) {
				meta.setAttribute('name', metaObj.name)
			} else if (metaObj.property) {
				meta.setAttribute('property', metaObj.property)
			}
			meta.setAttribute('content', metaObj.content)
			head.appendChild(meta)
		}

		return html.outerHTML
	}

	return index
}