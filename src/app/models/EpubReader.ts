import * as JSZip from 'jszip'
import {
	TextElement,
	ExtractTextElements,
	CreateHtmlElementFromTextElement
} from './TextExtractor'

export class EpubReader {
	private initialized: boolean = false
	private metadataLoaded: boolean = false
	private chaptersLoaded: boolean = false

	//#region Metadata variables
	title: string
	author: string
	language: string
	cover: EpubManifestItem
	coverSrc: string
	//#endregion

	private opfDoc: Document
	private opfFilePath: string
	private opfFileDir: string

	entries: { [key: string]: JSZip.JSZipObject } = {}
	chapters: EpubChapter[] = []
	manifestItems: EpubManifestItem[] = []
	toc: EpubTocItem[] = []

	async Init(zipFile: Blob): Promise<boolean> {
		if (this.initialized) return false

		// Load the entries of the zip file
		this.entries = (await JSZip.loadAsync(zipFile)).files

		// Get the container file
		let containerEntry = this.entries["META-INF/container.xml"]
		if (!containerEntry) {
			// The epub file is invalid
			return false
		}

		// Get the content of the container file
		this.opfFilePath = await GetOpfFilePath(containerEntry)
		this.opfFileDir = GetFileDirectory(this.opfFilePath)

		// Get the opf file
		let opfFileEntry = this.entries[this.opfFilePath]
		if (!opfFileEntry) {
			// The epub file is invalid
			return false
		}

		// Get the content of the opf file
		let opfContent = await opfFileEntry.async("text")

		// Read the OPF file content
		let parser = new DOMParser()
		this.opfDoc = parser.parseFromString(opfContent, "text/xml")

		this.initialized = true
		return true
	}

	async LoadMetadata(): Promise<boolean> {
		if (!this.initialized) return false
		if (this.metadataLoaded) return false

		// Get the manifest items
		let manifestTag = this.opfDoc.getElementsByTagName("manifest")[0]
		let manifestItemTags = manifestTag.getElementsByTagName("item")

		for (let i = 0; i < manifestItemTags.length; i++) {
			let manifestItemTag = manifestItemTags[i]
			this.manifestItems.push(new EpubManifestItem(manifestItemTag.getAttribute("id"), this.opfFileDir + manifestItemTag.getAttribute("href"), manifestItemTag.getAttribute("media-type")))
		}

		// Get the metadata content
		let metadataTag = this.opfDoc.getElementsByTagName("metadata")[0]
		let titleItem = metadataTag.getElementsByTagName("dc:title").item(0)
		if (titleItem) this.title = titleItem.innerHTML
		let authorItem = metadataTag.getElementsByTagName("dc:creator").item(0)
		if (authorItem) this.author = authorItem.innerHTML
		let languageItem = metadataTag.getElementsByTagName("dc:language").item(0)
		if (languageItem) this.language = languageItem.innerHTML

		// Find the cover image tag
		let metaTags = metadataTag.getElementsByTagName("meta")
		for (let i = 0; i < metaTags.length; i++) {
			let metaTagName = metaTags.item(i).getAttribute("name")
			if (metaTagName == "cover") {
				// Get the content attribute
				let metaTagContent = metaTags.item(i).getAttribute("content")

				// Find the manifest item with id = metaTagContent
				let index = this.manifestItems.findIndex(item => item.id == metaTagContent)
				if (index !== -1) {
					this.cover = this.manifestItems[index]

					// Get the content of the cover file
					let coverEntry = this.entries[this.cover.href]
					let coverContent = await coverEntry.async("base64")

					// Get the mime type
					let mimeType = this.cover.mediaType
					this.coverSrc = `data:${mimeType};base64,${coverContent}`
				}
			}
		}

		this.metadataLoaded = true
		return true
	}

	async LoadChapters(): Promise<boolean> {
		if (!this.initialized) return false
		if (this.chaptersLoaded) return false

		// Make sure the metadata is loaded
		if (
			!this.metadataLoaded
			&& !await this.LoadMetadata()
		) return false

		// Get the spine content
		let spineTag = this.opfDoc.getElementsByTagName("spine")[0]
		let spineItemTags = spineTag.getElementsByTagName("itemref")

		for (let i = 0; i < spineItemTags.length; i++) {
			let idref = spineItemTags[i].getAttribute("idref")

			// Get the item with the id from the manifest items
			let index = this.manifestItems.findIndex(item => item.id == idref)
			if (index !== -1) {
				let itemPath = this.manifestItems[index].href

				// Find the entry with the filename
				var key = Object.keys(this.entries).find(entry => entry.includes(itemPath))
				if (!key) continue

				// Read the content of the entry
				let entryContent = await this.entries[key].async("text")
				this.chapters.push(new EpubChapter(this, idref, itemPath, entryContent))
			}
		}

		// Get the toc file
		let tocFilePath = "toc.ncx"
		let tocDirectory = ""

		if (this.opfFilePath.includes('/')) {
			tocDirectory = this.opfFilePath.slice(0, this.opfFilePath.lastIndexOf('/')) + "/"
			tocFilePath = tocDirectory + "toc.ncx"
		}

		let tocEntry = this.entries[tocFilePath]
		if (tocEntry) {
			// Get the content of the toc file
			let tocContent = await tocEntry.async("text")

			let parser = new DOMParser()
			let tocDoc = parser.parseFromString(tocContent, "text/xml")
			let navMap = tocDoc.getElementsByTagName("navMap")[0]
			this.toc = GetTocItems(navMap, tocDirectory)
		}

		this.chaptersLoaded = true
		return true
	}
}

export class EpubChapter {
	private currentPath: string
	private html: HTMLHtmlElement

	constructor(
		public book: EpubReader,
		public id: string,
		public filePath: string,
		private htmlContent: string
	) {
		// Get the current path from the file path
		this.currentPath = GetFileDirectory(this.filePath)

		// Remove all line breaks from the html content
		this.htmlContent = this.htmlContent.trim().replace(/\n/g, '').replace(/\t/g, ' ').replace(/\r/g, ' ')
	}

	async GetChapterHtml(): Promise<HTMLHtmlElement> {
		if (this.html != null) return this.html

		let parser = new DOMParser()
		let chapterDocument = parser.parseFromString(this.htmlContent, "text/html")
		let chapterBody = chapterDocument.getElementsByTagName("body")[0]

		await this.LoadBodyHtml(chapterBody)

		// Build the new html
		let html = document.createElement("html")
		let head = document.createElement("head")
		let body = document.createElement("body")
		html.appendChild(head)
		html.appendChild(body)

		let textElements: TextElement[] = ExtractTextElements(chapterBody)

		for (let textElement of textElements) {
			let child = CreateHtmlElementFromTextElement(textElement)
			if (child) body.appendChild(child)
		}

		return html
	}

	private async LoadBodyHtml(chapterBody: HTMLBodyElement) {
		// Inject the images directly into the html
		// Get the img tags with src attribute
		let imgTags = chapterBody.getElementsByTagName("img")

		for (let i = 0; i < imgTags.length; i++) {
			let imageTag = imgTags[i]
			let src = imageTag.getAttribute("src")
			let newSrc = await this.GetRawImageSource(src)
			if (newSrc == null) continue

			let alt = imageTag.getAttribute("alt")
			let title = imageTag.getAttribute("title")

			// Create the new image tag with the new src
			let newImageTag = document.createElement("img")

			let imageLoadPromise = new Promise(resolve => {
				newImageTag.onload = resolve
			})
			newImageTag.src = newSrc

			// Wait until the image loaded
			await imageLoadPromise

			// Set the width and height attributes
			newImageTag.setAttribute("height", newImageTag.naturalHeight.toString())
			newImageTag.setAttribute("width", newImageTag.naturalWidth.toString())
			if (alt) newImageTag.setAttribute("alt", alt)
			if (title) newImageTag.setAttribute("title", title)

			// Replace the old image tag with the new one
			imageTag.parentNode.replaceChild(newImageTag, imageTag)
		}

		// Get the images from svg tags and add them as img tags
		let svgTags = chapterBody.getElementsByTagName("svg")
		for (let i = 0; i < svgTags.length; i++) {
			let svgTag = svgTags[i]

			// Get the image tags
			let imageTags = chapterBody.getElementsByTagName("image")
			let newImageTags = []

			for (let j = 0; j < imageTags.length; j++) {
				let imageTag = imageTags[i]
				let src = imageTag.getAttribute("xlink:href")
				let newSrc = await this.GetRawImageSource(src)

				// Get height & width
				let height = imageTag.getAttribute("height")
				let width = imageTag.getAttribute("width")

				// Create the new image tag with the new src
				let newImageTag = document.createElement("img")
				newImageTag.src = newSrc
				newImageTag.setAttribute("height", height)
				newImageTag.setAttribute("width", width)
				newImageTags.push(newImageTag)
			}

			// Replace the svg tags with the content
			for (let newImageTag of newImageTags) {
				svgTag.parentNode.replaceChild(newImageTag, svgTag)
			}
		}

		// Update links with absolute paths
		let aTags = chapterBody.getElementsByTagName("a")

		for (let i = 0; i < aTags.length; i++) {
			let aTag = aTags[i]

			// Get the href
			let href = aTag.getAttribute("href")

			// Check if the link is a local file
			if (
				href == null
				|| href.startsWith('http://')
				|| href.startsWith('https://')
				|| href.startsWith('www.')
				|| href.startsWith('mailto:')
			) continue

			// Update the href with the absolute path
			if (href) aTag.setAttribute("href", MergePaths(this.currentPath, href))
		}
	}

	private async GetRawImageSource(src: string): Promise<string> {
		// Get the image from the zip package
		let imagePath = MergePaths(this.currentPath, src)

		// Get the image from the zip file entries
		let entry = this.book.entries[imagePath]
		if (entry) {
			// Get the image content
			let imageContent = await entry.async("base64")

			// Get the mime type from the manifest items
			let index = this.book.manifestItems.findIndex(item => item.href == imagePath)
			let mimeType = index !== -1 ? this.book.manifestItems[index].mediaType : "image/jpg"

			return `data:${mimeType};base64,${imageContent}`
		}

		return null
	}
}

export class EpubManifestItem {
	constructor(
		public id: string,
		public href: string,
		public mediaType: string
	) { }
}

export class EpubTocItem {
	constructor(
		public id: string,
		public title: string,
		public href: string,
		public items: EpubTocItem[]
	) { }
}

async function GetOpfFilePath(containerEntry: JSZip.JSZipObject): Promise<string> {
	let containerContent = await containerEntry.async("text")

	let parser = new DOMParser()
	let containerDoc = parser.parseFromString(containerContent, "text/xml")
	let container = containerDoc.getElementsByTagName("container")[0]
	let rootFiles = container.getElementsByTagName("rootfiles")[0]
	let rootFile = rootFiles.getElementsByTagName("rootfile")[0]
	return rootFile.getAttribute("full-path")
}

function GetFileDirectory(filePath: string) {
	let directory = filePath.split('/').slice(0, -1).join('/')
	if (directory.length > 0) {
		directory += '/'
	}
	return directory
}

function GetParentDirectory(directoryPath: string) {
	// If the path is not root, remove the deepest directory (the last two parts of the directory parts array)
	let directoryParts = directoryPath.split('/')

	let removedNumberOfElements = 1
	if (directoryParts.length > 2) {
		removedNumberOfElements = 2
	}
	directoryParts = directoryParts.slice(0, -removedNumberOfElements)

	return directoryParts.join('/') + '/'
}

function MergePaths(currentPath: string, source: string) {
	let path = currentPath
	while (source.includes("../")) {
		// For each ../ go one directory up in the path
		source = source.replace('../', '')
		path = GetParentDirectory(path)
	}
	return path + source
}

function GetTocItems(parentElement: Element, tocDirectory: string): EpubTocItem[] {
	let navpoints = parentElement.getElementsByTagName("navPoint")
	let tocItems: EpubTocItem[] = []

	for (let i = 0; i < navpoints.length; i++) {
		let item = navpoints.item(i)
		if (item.parentElement == parentElement) {
			tocItems.push(GetTocItem(item, tocDirectory))
		}
	}

	return tocItems
}

function GetTocItem(navpoint: Element, tocDirectory: string): EpubTocItem {
	// Get the id
	let id = navpoint.getAttribute('id')

	// Get the title
	let navlabel = navpoint.getElementsByTagName("navLabel")[0]
	let text = navlabel.getElementsByTagName("text")[0]
	let title = text.innerHTML

	// Get the href
	let content = navpoint.getElementsByTagName("content")[0]
	let href = MergePaths(tocDirectory, content.getAttribute("src"))

	// Get nested items
	let items = GetTocItems(navpoint, tocDirectory)

	return new EpubTocItem(id, title, href, items)
}