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
		let yPos = childPosition.height + childPosition.top + 2

		if (positions.length == 0 || (positions.length > 0 && positions[positions.length - 1] != yPos)) {
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

export function AdaptLinkTag(tag: Node, callback: Function) {
	if (tag.nodeType == 3 || tag.nodeName.toLowerCase() != "a") return

	let linkTag = tag as HTMLAnchorElement
	let link = linkTag.getAttribute("href")
	if (link == null) return

	if (
		link.indexOf('http://') == 0
		|| link.indexOf('https://') == 0
		|| link.indexOf('www.') == 0)
	{
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

	if (window["getWindowSegments"]) {
		let screenSegments = window["getWindowSegments"]()

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

export function UpdateDialogForDualScreenLayout() {
	setTimeout(() => {
		let overlayElement = document.getElementsByClassName("ms-Overlay")[0] as HTMLDivElement
		let dialogElement = document.getElementsByClassName("ms-Dialog")[0] as HTMLDivElement
		let dialogParentElement = dialogElement.parentElement as HTMLDivElement

		// Set the width of the dialog
		dialogElement.setAttribute("style", "width: 50%")

		// Move the overlay one element up
		dialogParentElement.insertBefore(overlayElement, dialogParentElement.children.item(0))
	}, 1)
}

export function GetElementHeight(element: HTMLElement): number {
	return element.offsetHeight
		+ parseInt(document.defaultView.getComputedStyle(element).marginTop)
		+ parseInt(document.defaultView.getComputedStyle(element).marginBottom)
}