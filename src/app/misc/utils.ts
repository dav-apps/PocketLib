import {
	StoreBookStatus,
	StoreBookReleaseStatus,
	PublisherResource,
	PublisherProfileImageResource,
	AuthorResource,
	AuthorBioResource,
	AuthorProfileImageResource,
	StoreBookCollectionResource,
	StoreBookCollectionNameResource,
	StoreBookSeriesResource,
	StoreBookResource,
	StoreBookCoverResource,
	StoreBookFileResource,
	StoreBookReleaseResource,
	CategoryResource,
	BookResource,
	Language
} from './types'

/**
 * Recursively finds all positions in the given element and adds them to the array
 * @param element 
 * @param positions 
 */
export function FindPositionsInHtmlElement(element: Element, positions: number[]) {
	for (let i = 0; i < element.children.length; i++) {
		// Call this function for each child
		let child = element.children.item(i)
		FindPositionsInHtmlElement(child, positions)

		let childPosition = child.getBoundingClientRect()
		let yPos = childPosition.height + childPosition.top

		if (!positions.includes(yPos)) {
			positions.push(yPos)
		}
	}
}

/**
 * Finds the optimal positions for page breaks
 * @param positions The possible positions for a page break
 * @param pageHeight The height of the page
 * @returns The optimal page break positions based on the given positions
 */
export function FindPageBreakPositions(positions: number[], pageHeight: number): number[] {
	let pageBreakPositions: number[] = [0]

	for (let i = 0; i < positions.length; i++) {
		let lastPosition = pageBreakPositions[pageBreakPositions.length - 1]

		// Check if the current position is on the next page
		if (positions[i + 1] && positions[i + 1] > lastPosition + pageHeight) {
			pageBreakPositions.push(positions[i])
		}
	}

	return pageBreakPositions
}

// Go through each element until the element was found, returns -1 if position was not found
export function FindPositionById(currentElement: Element, id: string): number {
	if (currentElement.getAttribute("id") == id) {
		let position = currentElement.getBoundingClientRect()
		return position.top
	}

	if (currentElement.children.length > 0) {
		// Call FindPositionById for each child
		for (let i = 0; i < currentElement.children.length; i++) {
			let child = currentElement.children.item(i)
			let childPosition = FindPositionById(child, id)

			if (childPosition != -1) {
				return childPosition
			}
		}
	}

	return -1
}

export function FindPageForPosition(position: number, pagePositions: number[]): number {
	if (position >= pagePositions[pagePositions.length - 1]) return pagePositions.length - 1

	for (let i = 0; i < pagePositions.length - 1; i++) {
		if (position >= pagePositions[i] && position < pagePositions[i + 1]) {
			return i
		}
	}

	return -1
}

export function AdaptLinkTag(tag: Node, callback: Function) {
	if (tag.nodeType == 3 || tag.nodeName.toLowerCase() != "a") return

	let linkTag = tag as HTMLAnchorElement
	let link = linkTag.getAttribute("href")
	if (link == null) return

	if (
		link.startsWith('http://')
		|| link.startsWith('https://')
		|| link.startsWith('www.')
	) {
		// Set target = blank
		linkTag.setAttribute("target", "blank")
	} else if (link.indexOf('mailto:') != 0) {
		linkTag.onclick = () => {
			callback(link)
			return false
		}
	}
}

export function BytesToGigabytesText(bytes: number, rounding: number): string {
	if (bytes == 0) return "0"
	let gb = Math.round(bytes / 1000000000).toFixed(rounding)
	return gb == "0.0" ? "0" : gb
}

export function GetDualScreenSettings() {
	let settings = {
		dualScreenLayout: false,
		dualScreenFoldMargin: 0
	}

	let screenSegments: any

	if (window["getWindowSegments"]) {
		screenSegments = window["getWindowSegments"]()
	} else if (window.visualViewport["segments"]) {
		screenSegments = window.visualViewport["segments"]
	}

	if (screenSegments) {
		if (screenSegments.length > 1 && screenSegments[0].width == screenSegments[1].width) {
			settings.dualScreenLayout = true

			// Calculate the width of the fold
			let foldWidth = screenSegments[1].left - screenSegments[0].right
			if (foldWidth > 0) {
				settings.dualScreenFoldMargin = foldWidth / 2
			}
		}
	}

	return settings
}

export function GetAllLanguages(): Language[] {
	return [
		Language.en,
		Language.de
	]
}

export function GetStoreBookStatusByString(status: string): StoreBookStatus {
	switch (status) {
		case "published":
			return StoreBookStatus.Published
		case "review":
			return StoreBookStatus.Review
		case "hidden":
			return StoreBookStatus.Hidden
		default:
			return StoreBookStatus.Unpublished
	}
}

export function GetStoreBookReleaseStatusByString(status: string): StoreBookReleaseStatus {
	switch (status) {
		case "published":
			return StoreBookReleaseStatus.Published
		default:
			return StoreBookReleaseStatus.Unpublished
	}
}

export function GetLanguageByString(language: string): Language {
	switch (language) {
		case "de":
			return Language.de
		default:
			return Language.en
	}
}

export function AdaptCoverWidthHeightToAspectRatio(
	aproxWidth: number,
	aproxHeight: number,
	aspectRatio: string
): number {
	if (aspectRatio == null) return aproxWidth
	let parts = aspectRatio.split(':')

	if (parts.length > 1 && parts[0].length > 0 && parts[1].length > 0) {
		let widthAspectRatio = +parts[0]
		let heightAspectRatio = +parts[1]

		if (widthAspectRatio == 1) {
			// 1:2 -> 0.5:1
			widthAspectRatio /= heightAspectRatio
		}

		aproxWidth = Math.round(aproxHeight * widthAspectRatio)
	}

	return aproxWidth
}

export function ResponseDataToPublisherResource(responseData: any): PublisherResource {
	let publisherResource: PublisherResource = {
		uuid: responseData.uuid,
		name: responseData.name,
		description: responseData.description,
		websiteUrl: responseData.website_url,
		facebookUsername: responseData.facebook_username,
		instagramUsername: responseData.instagram_username,
		twitterUsername: responseData.twitter_username,
		profileImage: null
	}

	if (responseData.profile_image != null) {
		publisherResource.profileImage = {
			url: responseData.profile_image.url,
			blurhash: responseData.profile_image.blurhash
		}
	}

	return publisherResource
}

export function ResponseDataToPublisherProfileImageResource(responseData: any): PublisherProfileImageResource {
	return {
		uuid: responseData.uuid,
		url: responseData.url,
		blurhash: responseData.blurhash
	}
}

export function ResponseDataToAuthorResource(responseData: any): AuthorResource {
	let authorResource: AuthorResource = {
		uuid: responseData.uuid,
		firstName: responseData.first_name,
		lastName: responseData.last_name,
		bio: null,
		websiteUrl: responseData.website_url,
		facebookUsername: responseData.facebook_username,
		instagramUsername: responseData.instagram_username,
		twitterUsername: responseData.twitter_username,
		profileImage: null
	}

	if (responseData.bio != null) {
		authorResource.bio = {
			value: responseData.bio.value,
			language: responseData.bio.language
		}
	}

	if (responseData.profile_image != null) {
		authorResource.profileImage = {
			url: responseData.profile_image.url,
			blurhash: responseData.profile_image.blurhash
		}
	}

	return authorResource
}

export function ResponseDataToAuthorBioResource(responseData: any): AuthorBioResource {
	return {
		uuid: responseData.uuid,
		bio: responseData.bio,
		language: responseData.language
	}
}

export function ResponseDataToAuthorProfileImageResource(responseData: any): AuthorProfileImageResource {
	return {
		uuid: responseData.uuid,
		url: responseData.url,
		blurhash: responseData.blurhash
	}
}

export function ResponseDataToStoreBookCollectionResource(responseData: any): StoreBookCollectionResource {
	let storeBookCollectionResource: StoreBookCollectionResource = {
		uuid: responseData.uuid,
		author: responseData.author,
		name: null
	}

	if (responseData.name != null) {
		storeBookCollectionResource.name = {
			value: responseData.name.value,
			language: responseData.name.language
		}
	}

	return storeBookCollectionResource
}

export function ResponseDataToStoreBookCollectionNameResource(responseData: any): StoreBookCollectionNameResource {
	return {
		uuid: responseData.uuid,
		name: responseData.name,
		language: responseData.language
	}
}

export function ResponseDataToStoreBookSeriesResource(responseData: any): StoreBookSeriesResource {
	return {
		uuid: responseData.uuid,
		author: responseData.author,
		name: responseData.name,
		language: responseData.language
	}
}

export function ResponseDataToStoreBookResource(responseData: any): StoreBookResource {
	let storeBookResource: StoreBookResource = {
		uuid: responseData.uuid,
		collection: responseData.collection,
		title: responseData.title,
		description: responseData.description,
		language: responseData.language,
		price: responseData.price,
		isbn: responseData.isbn,
		status: responseData.status,
		cover: null,
		file: null,
		inLibrary: responseData.in_library,
		purchased: responseData.purchased,
		categories: responseData.categories
	}

	if (responseData.cover != null) {
		storeBookResource.cover = {
			url: responseData.cover.url,
			aspectRatio: responseData.cover.aspect_ratio,
			blurhash: responseData.cover.blurhash
		}
	}

	if (responseData.file != null) {
		storeBookResource.file = {
			fileName: responseData.file.file_name
		}
	}

	return storeBookResource
}

export function ResponseDataToStoreBookCoverResource(responseData: any): StoreBookCoverResource {
	return {
		uuid: responseData.uuid,
		url: responseData.url,
		aspectRatio: responseData.aspect_ratio,
		blurhash: responseData.blurhash
	}
}

export function ResponseDataToStoreBookFileResource(responseData: any): StoreBookFileResource {
	return {
		uuid: responseData.uuid,
		fileName: responseData.file_name
	}
}

export function ResponseDataToStoreBookReleaseResource(responseData: any): StoreBookReleaseResource {
	let storeBookReleaseResource: StoreBookReleaseResource = {
		uuid: responseData.uuid,
		storeBook: responseData.store_book,
		releaseName: responseData.release_name,
		releaseNotes: responseData.release_notes,
		publishedAt: responseData.published_at,
		title: responseData.title,
		description: responseData.description,
		price: responseData.price,
		isbn: responseData.isbn,
		status: responseData.status,
		cover: null,
		file: null,
		categories: responseData.categories
	}

	if (responseData.cover != null) {
		storeBookReleaseResource.cover = {
			url: responseData.cover.url,
			aspectRatio: responseData.cover.aspect_ratio,
			blurhash: responseData.cover.blurhash
		}
	}

	if (responseData.file != null) {
		storeBookReleaseResource.file = {
			fileName: responseData.file.file_name
		}
	}

	return storeBookReleaseResource
}

export function ResponseDataToCategoryResource(responseData: any): CategoryResource {
	let categoryResource: CategoryResource = {
		uuid: responseData.uuid,
		key: responseData.key,
		name: null
	}

	if (responseData.name != null) {
		categoryResource.name = {
			value: responseData.name.value,
			language: responseData.name.language
		}
	}

	return categoryResource
}

export function ResponseDataToBookResource(responseData: any): BookResource {
	return {
		uuid: responseData.uuid,
		storeBook: responseData.store_book,
		file: responseData.file
	}
}