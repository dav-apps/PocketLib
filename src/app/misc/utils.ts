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