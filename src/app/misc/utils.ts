import { defaultDataIdFromObject } from "@apollo/client/core"
import {
	faBooks as faBooksLight,
	faChildren as faChildrenLight,
	faComments as faCommentsLight,
	faDragon as faDragonLight,
	faFaceAwesome as faFaceAwesomeLight,
	faGlobeStand as faGlobeStandLight,
	faGhost as faGhostLight,
	faHandsPraying as faHandsPrayingLight,
	faHeadSide as faHeadSideLight,
	faMasksTheater as faMasksTheaterLight,
	faRocketLaunch as faRocketLaunchLight,
	faSailboat as faSailboatLight,
	faSquareRootVariable as faSquareRootVariableLight,
	faThoughtBubble as faThoughtBubbleLight,
	faUnicorn as faUnicornLight,
	faUserSecret as faUserSecretLight
} from "@fortawesome/pro-light-svg-icons"
import {
	Category,
	CategoryCard,
	StoreBookStatus,
	StoreBookReleaseStatus,
	Language
} from "./types"

/**
 * Recursively finds all positions in the given element and adds them to the array
 * @param element
 * @param positions
 */
export function FindPositionsInHtmlElement(
	element: Element,
	positions: number[]
) {
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
export function FindPageBreakPositions(
	positions: number[],
	pageHeight: number
): number[] {
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

export function FindPageForPosition(
	position: number,
	pagePositions: number[]
): number {
	if (position >= pagePositions[pagePositions.length - 1]) {
		return pagePositions.length - 1
	}

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
		link.startsWith("http://") ||
		link.startsWith("https://") ||
		link.startsWith("www.")
	) {
		// Set target = blank
		linkTag.setAttribute("target", "blank")
	} else if (link.indexOf("mailto:") != 0) {
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
		if (
			screenSegments.length > 1 &&
			screenSegments[0].width == screenSegments[1].width
		) {
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
	return [Language.en, Language.de]
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

export function GetStoreBookReleaseStatusByString(
	status: string
): StoreBookReleaseStatus {
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
	let parts = aspectRatio.split(":")

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

export function GenerateFacebookLink(facebookUsername: string): string {
	if (facebookUsername == null) return ""
	return `https://facebook.com/${facebookUsername}`
}

export function GenerateInstagramLink(instagramUsername: string): string {
	if (instagramUsername == null) return ""
	return `https://instagram.com/${instagramUsername}`
}

export function GenerateTwitterLink(twitterUsername: string): string {
	if (twitterUsername == null) return ""
	return `https://twitter.com/${twitterUsername}`
}

export function CategoryToCategoryCard(category: Category): CategoryCard {
	let card: CategoryCard = {
		text: category.name,
		icon: null
	}

	switch (category.key) {
		case "biography":
			card.icon = faHeadSideLight
			break
		case "fiction":
			card.icon = faUnicornLight
			break
		case "adventure":
			card.icon = faGlobeStandLight
			break
		case "science-fiction":
			card.icon = faRocketLaunchLight
			break
		case "poetry":
			card.icon = faCommentsLight
			break
		case "horror":
			card.icon = faGhostLight
			break
		case "memoir":
			card.icon = faHeadSideLight
			break
		case "autobiography":
			card.icon = faHeadSideLight
			break
		case "mystery":
			card.icon = faUserSecretLight
			break
		case "nonfiction":
			card.icon = faSquareRootVariableLight
			break
		case "fantasy":
			card.icon = faDragonLight
			break
		case "travel":
			card.icon = faSailboatLight
			break
		case "shorts":
			card.icon = faBooksLight
			break
		case "comedy":
			card.icon = faFaceAwesomeLight
			break
		case "drama":
			card.icon = faMasksTheaterLight
			break
		case "childrens":
			card.icon = faChildrenLight
			break
		case "satire":
			card.icon = faFaceAwesomeLight
			break
		case "spirituality":
			card.icon = faHandsPrayingLight
			break
		case "philosophy":
			card.icon = faThoughtBubbleLight
			break
	}

	if (card.icon) {
		return card
	}

	return null
}

export function dataIdFromObject(responseObject: any) {
	if (responseObject.uuid != null) {
		return `${responseObject.__typename}:${responseObject.uuid}`
	}

	return defaultDataIdFromObject(responseObject)
}
