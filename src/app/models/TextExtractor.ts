export function CreateHtmlElementFromTextElement(textElement: TextElement): HTMLElement {
	switch (textElement.Type) {
		case TextElementType.H1:
		case TextElementType.H2:
		case TextElementType.H3:
		case TextElementType.H4:
		case TextElementType.H5:
		case TextElementType.H6:
			let headerElement = document.createElement(textElement.Type) as HTMLHeadingElement
			if (textElement.Id) headerElement.id = textElement.Id
			headerElement.setAttribute("style", "text-align: center; margin-top: 2em; margin-bottom: 2em; font-weight: 300")

			if (textElement.TextElements) {
				for (let innerTextElement of textElement.TextElements) {
					let headerChild = CreateHtmlElementFromTextElement(innerTextElement)
					if (headerChild) headerElement.appendChild(headerChild)
				}
			}

			return headerElement
		case TextElementType.P:
			let pElement = document.createElement("p") as HTMLParagraphElement
			if (textElement.Id) pElement.id = textElement.Id

			if (textElement.TextElements) {
				for (let innerTextElement of textElement.TextElements) {
					let pChild = CreateHtmlElementFromTextElement(innerTextElement)
					if (pChild) pElement.appendChild(pChild)
				}
			}

			return pElement
		case TextElementType.SPAN:
			let spanElement = document.createElement("span") as HTMLSpanElement
			if (textElement.Id) spanElement.id = textElement.Id
			if (textElement.Content) spanElement.innerHTML = textElement.Content.replace(/ /g, '<span> </span>')
			return spanElement
		case TextElementType.I:
			let iElement = document.createElement("i") as HTMLElement
			if (textElement.Id) iElement.id = textElement.Id

			if (textElement.TextElements) {
				for (let innerTextElement of textElement.TextElements) {
					let iChild = CreateHtmlElementFromTextElement(innerTextElement)
					if (iChild) iElement.appendChild(iChild)
				}
			}

			return iElement
		case TextElementType.EM:
			let emElement = document.createElement("em") as HTMLElement
			if (textElement.Id) emElement.id = textElement.Id

			if (textElement.TextElements) {
				for (let innerTextElement of textElement.TextElements) {
					let emChild = CreateHtmlElementFromTextElement(innerTextElement)
					if (emChild) emElement.appendChild(emChild)
				}
			}

			return emElement
		case TextElementType.B:
			let bElement = document.createElement("b") as HTMLElement
			if (textElement.Id) bElement.id = textElement.Id

			if (textElement.TextElements) {
				for (let innerTextElement of textElement.TextElements) {
					let bChild = CreateHtmlElementFromTextElement(innerTextElement)
					if (bChild) bElement.appendChild(bChild)
				}
			}

			return bElement
		case TextElementType.STRONG:
			let strongElement = document.createElement("strong") as HTMLElement
			if (textElement.Id) strongElement.id = textElement.Id

			if (textElement.TextElements) {
				for (let innerTextElement of textElement.TextElements) {
					let strongChild = CreateHtmlElementFromTextElement(innerTextElement)
					if (strongChild) strongElement.appendChild(strongChild)
				}
			}

			return strongElement
		case TextElementType.BLOCKQUOTE:
			let blockquoteElement = document.createElement("blockquote") as HTMLQuoteElement
			if (textElement.Id) blockquoteElement.id = textElement.Id

			if (textElement.TextElements) {
				for (let innerTextElement of textElement.TextElements) {
					let childElement = CreateHtmlElementFromTextElement(innerTextElement)
					if (childElement == null) continue

					if (innerTextElement.Type == TextElementType.FOOTER) {
						childElement.setAttribute("style", "text-align: right")
					}

					blockquoteElement.appendChild(childElement)
				}
			}

			return blockquoteElement
		case TextElementType.FOOTER:
			let footerElement = document.createElement("footer") as HTMLElement
			if (textElement.Id) footerElement.id = textElement.Id

			if (textElement.TextElements) {
				for (let innerTextElement of textElement.TextElements) {
					let footerChild = CreateHtmlElementFromTextElement(innerTextElement)
					if (footerChild) footerElement.appendChild(footerChild)
				}
			}

			return footerElement
		case TextElementType.A:
			let aElement = document.createElement("a") as HTMLAnchorElement
			if (textElement.Id) aElement.id = textElement.Id
			if (textElement.Href) aElement.setAttribute("href", textElement.Href)

			if (textElement.TextElements) {
				for (let innerTextElement of textElement.TextElements) {
					let aChild = CreateHtmlElementFromTextElement(innerTextElement)
					if (aChild) aElement.appendChild(aChild)
				}
			}

			return aElement
		case TextElementType.IMG:
			let imgElement = document.createElement("img") as HTMLImageElement
			if (textElement.Id) imgElement.id = textElement.Id
			imgElement.setAttribute("src", textElement.Source)
			if (textElement.Alt) imgElement.setAttribute("alt", textElement.Alt)
			imgElement.setAttribute("style", "text-align: center")

			let imgContainerElement = document.createElement("div")
			let imgContainerElementStyle = "display: flex; justify-content: center; margin-top: 2em; margin-bottom: 2em"

			// Check if the image is within a p tag
			if (IsTextElementNestedWithinType(textElement, TextElementType.P)) {
				imgContainerElementStyle = "margin-top: 2em; margin-bottom: 2em"
			}

			imgContainerElement.setAttribute("style", imgContainerElementStyle)
			imgContainerElement.appendChild(imgElement)

			return imgContainerElement
		case TextElementType.OL:
			let olElement = document.createElement("ol") as HTMLUListElement
			if (textElement.Id) olElement.id = textElement.Id
		case TextElementType.UL:
			let ulElement = document.createElement("ul") as HTMLOListElement
			if (textElement.Id) ulElement.id = textElement.Id
			let listElement = textElement.Type == TextElementType.OL ? olElement : ulElement

			if (textElement.TextElements) {
				for (let innerTextElement of textElement.TextElements) {
					let listChild = CreateHtmlElementFromTextElement(innerTextElement)
					if (listChild) listElement.appendChild(listChild)
				}
			}

			return listElement
		case TextElementType.LI:
			let liElement = document.createElement("li") as HTMLLIElement
			if (textElement.Id) liElement.id = textElement.Id

			if (textElement.TextElements) {
				for (let innerTextElement of textElement.TextElements) {
					let liChild = CreateHtmlElementFromTextElement(innerTextElement)
					if (liChild) liElement.appendChild(liChild)
				}
			}

			return liElement.childElementCount > 0 ? liElement : null
		case TextElementType.HR:
			let hrElement = document.createElement("hr") as HTMLHRElement
			if (textElement.Id) hrElement.id = textElement.Id
			hrElement.setAttribute("style", "margin: 4em 0")
			return hrElement
		case TextElementType.BR:
			let brElement = document.createElement("br") as HTMLBRElement
			if (textElement.Id) brElement.id = textElement.Id
			return brElement
		case TextElementType.TABLE:
			let tableElement = document.createElement("table") as HTMLTableElement
			if (textElement.Id) tableElement.id = textElement.Id
			tableElement.setAttribute("style", "border-spacing: 1em")

			if (textElement.TextElements) {
				for (let innerTextElement of textElement.TextElements) {
					let tableChild = CreateHtmlElementFromTextElement(innerTextElement)
					if (tableChild) tableElement.appendChild(tableChild)
				}
			}

			return tableElement
		case TextElementType.TR:
			let trElement = document.createElement("tr") as HTMLTableRowElement
			if (textElement.Id) trElement.id = textElement.Id

			if (textElement.TextElements) {
				for (let innerTextElement of textElement.TextElements) {
					let trChild = CreateHtmlElementFromTextElement(innerTextElement)
					if (trChild) trElement.appendChild(trChild)
				}
			}

			return trElement
		case TextElementType.TH:
			let thElement = document.createElement("th") as HTMLTableHeaderCellElement
			if (textElement.Id) thElement.id = textElement.Id
			if (textElement.Colspan) thElement.colSpan = textElement.Colspan
			if (textElement.Rowspan) thElement.rowSpan = textElement.Rowspan
			thElement.setAttribute("style", "vertical-align: top")

			if (textElement.TextElements) {
				for (let innerTextElement of textElement.TextElements) {
					let thChild = CreateHtmlElementFromTextElement(innerTextElement)
					if (thChild) thElement.appendChild(thChild)
				}
			}

			return thElement
		case TextElementType.TD:
			let tdElement = document.createElement("td") as HTMLTableDataCellElement
			if (textElement.Id) tdElement.id = textElement.Id
			if (textElement.Colspan) tdElement.colSpan = textElement.Colspan
			if (textElement.Rowspan) tdElement.rowSpan = textElement.Rowspan
			tdElement.setAttribute("style", "vertical-align: top")

			if (textElement.TextElements) {
				for (let innerTextElement of textElement.TextElements) {
					let tdChild = CreateHtmlElementFromTextElement(innerTextElement)
					if (tdChild) tdElement.appendChild(tdChild)
				}
			}

			return tdElement
	}
}

/**
 * Recursively retrieves the text elements from the given html element
 * @param node The html node from which to extract the elements
 * @param parentElement The TextElement to which the result of this is added
 * @returns The TextElements of the given node
 */
export function ExtractTextElements(
	node: Node,
	parentElement?: TextElement,
	allowedTypes?: TextElementType[]
): TextElement[] {
	let textElements: TextElement[] = []

	if (node.nodeType == Node.TEXT_NODE) {
		let textContent = node.textContent

		if (textContent.trim().length > 0) {
			textElements.push({
				Type: TextElementType.SPAN,
				Content: textContent,
				ParentElement: parentElement
			})
		}
	} else if (node.nodeType == Node.ELEMENT_NODE) {
		if (allowedTypes) {
			// Check if the allowed types list contains the name of the current node
			let i = allowedTypes.findIndex(type => type.toString() == node.nodeName)
			if (i == -1) return textElements
		}

		switch (node.nodeName) {
			case "H1":
			case "H2":
			case "H3":
			case "H4":
			case "H5":
			case "H6":
				let headerElement = node as HTMLHeadingElement

				if (NodeContainsText(headerElement)) {
					// Add the element as a header
					let type = TextElementType.H1

					switch (headerElement.nodeName) {
						case "H1":
							type = TextElementType.H1
							break
						case "H2":
							type = TextElementType.H2
							break
						case "H3":
							type = TextElementType.H3
							break
						case "H4":
							type = TextElementType.H4
							break
						case "H5":
							type = TextElementType.H5
							break
						case "H6":
							type = TextElementType.H6
							break
					}

					let headerTextElement: TextElement = {
						Type: type,
						Id: headerElement.id,
						ParentElement: parentElement
					}

					headerTextElement.TextElements = GetInnerTextElements(headerElement, headerTextElement, allowedTypes ? allowedTypes : allowedTypesForHeaderElement)
					textElements.push(headerTextElement)
				} else {
					// Add the child elements
					for (let i = 0; i < headerElement.childNodes.length; i++) {
						let childNode = headerElement.childNodes.item(i)
						textElements.push(...ExtractTextElements(childNode, parentElement, allowedTypes))
					}
				}
				break
			case "P":
				let pElement = node as HTMLParagraphElement
				let pTextElement: TextElement = {
					Type: TextElementType.P,
					Id: pElement.id,
					ParentElement: parentElement
				}

				pTextElement.TextElements = GetInnerTextElements(pElement, pTextElement, allowedTypes ? allowedTypes : allowedTypesForParagraphElement)
				textElements.push(pTextElement)
				break
			case "SPAN":
				let spanElement = node as HTMLSpanElement
				let spanTextContent = spanElement.textContent

				if (spanTextContent.trim().length > 0) {
					textElements.push({
						Type: TextElementType.SPAN,
						Id: spanElement.id,
						Content: spanTextContent,
						ParentElement: parentElement
					})
				}
				break
			case "I":
				let iElement = node as HTMLElement

				let iTextElement: TextElement = {
					Type: TextElementType.I,
					Id: iElement.id,
					ParentElement: parentElement
				}

				iTextElement.TextElements = GetInnerTextElements(iElement, iTextElement, allowedTypesForIElement)
				textElements.push(iTextElement)
				break
			case "EM":
				let emElement = node as HTMLElement

				let emTextElement: TextElement = {
					Type: TextElementType.EM,
					Id: emElement.id,
					ParentElement: parentElement
				}

				emTextElement.TextElements = GetInnerTextElements(emElement, emTextElement, allowedTypesForEmElement)
				textElements.push(emTextElement)
				break
			case "B":
				let bElement = node as HTMLElement

				let bTextElement: TextElement = {
					Type: TextElementType.B,
					Id: bElement.id,
					ParentElement: parentElement
				}

				bTextElement.TextElements = GetInnerTextElements(bElement, bTextElement, allowedTypesForBElement)
				textElements.push(bTextElement)
				break
			case "STRONG":
				let strongElement = node as HTMLElement

				let strongTextElement: TextElement = {
					Type: TextElementType.STRONG,
					Id: strongElement.id,
					ParentElement: parentElement
				}

				strongTextElement.TextElements = GetInnerTextElements(strongElement, strongTextElement, allowedTypesForStrongElement)
				textElements.push(strongTextElement)
				break
			case "BLOCKQUOTE":
				let blockquoteElement = node as HTMLQuoteElement

				let blockquoteTextElement: TextElement = {
					Type: TextElementType.BLOCKQUOTE,
					Id: blockquoteElement.id,
					ParentElement: parentElement
				}

				blockquoteTextElement.TextElements = GetInnerTextElements(blockquoteElement, blockquoteTextElement, allowedTypesForBlockquoteElement)
				textElements.push(blockquoteTextElement)
				break
			case "FOOTER":
				let footerElement = node as HTMLElement

				let footerTextElement: TextElement = {
					Type: TextElementType.FOOTER,
					Id: footerElement.id,
					ParentElement: parentElement
				}

				footerTextElement.TextElements = GetInnerTextElements(footerElement, footerTextElement, allowedTypesForFooterElement)
				textElements.push(footerTextElement)
				break
			case "A":
				let aElement = node as HTMLAnchorElement

				if (NodeContainsText(aElement)) {
					// Add the element as an a tag
					let aTextElement: TextElement = {
						Type: TextElementType.A,
						Id: aElement.id,
						Href: aElement.getAttribute("href"),
						ParentElement: parentElement
					}

					aTextElement.TextElements = GetInnerTextElements(aElement, aTextElement, allowedTypesForAnchorElement)
					textElements.push(aTextElement)
				} else {
					// Add the child elements
					for (let i = 0; i < aElement.childNodes.length; i++) {
						let childNode = aElement.childNodes.item(i)
						textElements.push(...ExtractTextElements(childNode, parentElement, allowedTypes))
					}
				}
				break
			case "IMG":
				let imgElement = node as HTMLImageElement

				textElements.push({
					Type: TextElementType.IMG,
					Id: imgElement.id,
					Source: imgElement.getAttribute("src"),
					Alt: imgElement.getAttribute("alt"),
					ParentElement: parentElement
				})
				break
			case "OL":
				let olElement = node as HTMLOListElement
				let olTextElement: TextElement = {
					Type: TextElementType.OL,
					Id: olElement.id,
					ParentElement: parentElement
				}

				olTextElement.TextElements = GetInnerTextElements(olElement, olTextElement, allowedTypesForListElement)
				textElements.push(olTextElement)
				break
			case "UL":
				let ulElement = node as HTMLUListElement
				let ulTextElement: TextElement = {
					Type: TextElementType.UL,
					Id: ulElement.id,
					ParentElement: parentElement
				}

				ulTextElement.TextElements = GetInnerTextElements(ulElement, ulTextElement, allowedTypesForListElement)
				textElements.push(ulTextElement)
				break
			case "LI":
				let liElement = node as HTMLLIElement
				let liTextElement: TextElement = {
					Type: TextElementType.LI,
					Id: liElement.id,
					ParentElement: parentElement
				}

				liTextElement.TextElements = GetInnerTextElements(liElement, liTextElement, allowedTypesForListItemElement)
				textElements.push(liTextElement)
				break
			case "HR":
				textElements.push({
					Type: TextElementType.HR,
					Id: (node as HTMLHRElement).id,
					ParentElement: parentElement
				})
				break
			case "BR":
				textElements.push({
					Type: TextElementType.BR,
					Id: (node as HTMLBRElement).id,
					ParentElement: parentElement
				})
				break
			case "TABLE":
				let tableElement = node as HTMLTableElement
				let tableTextElement: TextElement = {
					Type: TextElementType.TABLE,
					Id: tableElement.id,
					ParentElement: parentElement
				}

				tableTextElement.TextElements = GetInnerTextElements(tableElement, tableTextElement, allowedTypesForTableElement)
				textElements.push(tableTextElement)
				break
			case "TR":
				let trElement = node as HTMLTableRowElement
				let trTextElement: TextElement = {
					Type: TextElementType.TR,
					Id: trElement.id,
					ParentElement: parentElement
				}

				trTextElement.TextElements = GetInnerTextElements(trElement, trTextElement, allowedTypesForTableRowElement)
				textElements.push(trTextElement)
				break
			case "TH":
				let thElement = node as HTMLTableHeaderCellElement
				let thTextElement: TextElement = {
					Type: TextElementType.TH,
					Id: thElement.id,
					Colspan: thElement.colSpan,
					Rowspan: thElement.rowSpan,
					ParentElement: parentElement
				}

				thTextElement.TextElements = GetInnerTextElements(thElement, thTextElement, allowedTypesForTableCellElement)
				textElements.push(thTextElement)
				break
			case "TD":
				let tdElement = node as HTMLTableDataCellElement
				let tdTextElement: TextElement = {
					Type: TextElementType.TD,
					Id: tdElement.id,
					Colspan: tdElement.colSpan,
					Rowspan: tdElement.rowSpan,
					ParentElement: parentElement
				}

				tdTextElement.TextElements = GetInnerTextElements(tdElement, tdTextElement, allowedTypesForTableCellElement)
				textElements.push(tdTextElement)
				break
			default:
				let element = node as HTMLElement
				if (element.id) {
					// Add empty span element with the id
					textElements.push({
						Type: TextElementType.SPAN,
						Id: element.id,
						ParentElement: parentElement
					})
				}

				for (let i = 0; i < element.childNodes.length; i++) {
					let childNode = element.childNodes.item(i)
					textElements.push(...ExtractTextElements(childNode, parentElement, allowedTypes))
				}
				break
		}
	}

	return textElements
}

function GetInnerTextElements(
	node: Node,
	parentElement: TextElement,
	allowedTypes: TextElementType[] = []
): TextElement[] {
	let textElements: TextElement[] = []

	for (let i = 0; i < node.childNodes.length; i++) {
		let childNode = node.childNodes.item(i)
		textElements.push(
			...ExtractTextElements(
				childNode,
				parentElement,
				allowedTypes
			)
		)
	}

	// Merge adjacent text elements
	let mergedTextElements: TextElement[] = []

	while (textElements.length > 0) {
		let currentElement = textElements[0]

		if (currentElement.Type == TextElementType.SPAN) {
			if (
				mergedTextElements.length > 0
				&& mergedTextElements[mergedTextElements.length - 1].Type == TextElementType.SPAN
			) {
				// Add the text of the current selected element to the last element of mergedTextElements
				mergedTextElements[mergedTextElements.length - 1].Content += " " + currentElement.Content
			} else {
				// Add new text element
				mergedTextElements.push({
					Type: TextElementType.SPAN,
					Id: currentElement.Id,
					Content: currentElement.Content,
					ParentElement: parentElement
				})
			}
		} else {
			mergedTextElements.push(currentElement)
		}

		textElements.splice(0, 1)
	}

	return mergedTextElements
}

function IsTextElementNestedWithinType(textElement: TextElement, elementType: TextElementType): boolean {
	if (textElement.ParentElement) {
		if (textElement.ParentElement.Type == elementType) {
			return true
		}

		return IsTextElementNestedWithinType(textElement.ParentElement, elementType)
	}

	return false
}

/**
 * Checks if the given node directly contains any text or text nodes
 * @param node The node to check for text
 * @returns Whether the node directly contains any text or text nodes
 */
function NodeContainsText(node: Node): boolean {
	for (let i = 0; i < node.childNodes.length; i++) {
		let childNode = node.childNodes.item(i)

		if (
			childNode.nodeType == Node.TEXT_NODE
			&& childNode.textContent.trim().length > 0
		) return true

		if (
			childNode.nodeType == Node.ELEMENT_NODE
			&& (
				childNode.nodeName == "SPAN"
				|| childNode.nodeName == "I"
				|| childNode.nodeName == "EM"
				|| childNode.nodeName == "B"
				|| childNode.nodeName == "STRONG"
				|| childNode.nodeName == "A"
			)
			&& childNode.textContent.trim().length > 0
		) return true
	}

	return false
}

export interface TextElement {
	Type: TextElementType
	Id?: string
	Content?: string
	Href?: string
	Source?: string
	Alt?: string
	Colspan?: number
	Rowspan?: number
	TextElements?: TextElement[],
	ParentElement?: TextElement
}

export enum TextElementType {
	H1 = "H1",
	H2 = "H2",
	H3 = "H3",
	H4 = "H4",
	H5 = "H5",
	H6 = "H6",
	P = "P",
	SPAN = "SPAN",
	I = "I",
	EM = "EM",
	B = "B",
	STRONG = "STRONG",
	BLOCKQUOTE = "BLOCKQUOTE",
	FOOTER = "FOOTER",
	A = "A",
	IMG = "IMG",
	UL = "UL",
	OL = "OL",
	LI = "LI",
	HR = "HR",
	BR = "BR",
	TABLE = "TABLE",
	TBODY = "TBODY",
	TR = "TR",
	TH = "TH",
	TD = "TD"
}

const allowedTypesForHeaderElement: TextElementType[] = [
	TextElementType.SPAN,
	TextElementType.I,
	TextElementType.EM,
	TextElementType.B,
	TextElementType.STRONG,
	TextElementType.A,
	TextElementType.BR
]

const allowedTypesForParagraphElement: TextElementType[] = [
	TextElementType.P,
	TextElementType.SPAN,
	TextElementType.I,
	TextElementType.EM,
	TextElementType.B,
	TextElementType.STRONG,
	TextElementType.BLOCKQUOTE,
	TextElementType.A,
	TextElementType.BR,
	TextElementType.IMG
]

const allowedTypesForIElement: TextElementType[] = [
	TextElementType.SPAN,
	TextElementType.EM,
	TextElementType.B,
	TextElementType.STRONG,
	TextElementType.A,
	TextElementType.BR
]

const allowedTypesForEmElement: TextElementType[] = [
	TextElementType.SPAN,
	TextElementType.I,
	TextElementType.B,
	TextElementType.STRONG,
	TextElementType.A,
	TextElementType.BR
]

const allowedTypesForBElement: TextElementType[] = [
	TextElementType.SPAN,
	TextElementType.I,
	TextElementType.EM,
	TextElementType.STRONG,
	TextElementType.A,
	TextElementType.BR
]

const allowedTypesForStrongElement: TextElementType[] = [
	TextElementType.SPAN,
	TextElementType.I,
	TextElementType.EM,
	TextElementType.B,
	TextElementType.A,
	TextElementType.BR
]

const allowedTypesForBlockquoteElement: TextElementType[] = [
	TextElementType.P,
	TextElementType.SPAN,
	TextElementType.I,
	TextElementType.EM,
	TextElementType.B,
	TextElementType.STRONG,
	TextElementType.BLOCKQUOTE,
	TextElementType.FOOTER,
	TextElementType.A,
	TextElementType.BR
]

const allowedTypesForFooterElement: TextElementType[] = [
	TextElementType.P,
	TextElementType.SPAN,
	TextElementType.I,
	TextElementType.EM,
	TextElementType.B,
	TextElementType.STRONG,
	TextElementType.A,
	TextElementType.BR
]

const allowedTypesForAnchorElement: TextElementType[] = [
	TextElementType.SPAN,
	TextElementType.I,
	TextElementType.EM,
	TextElementType.B,
	TextElementType.STRONG,
	TextElementType.BR
]

const allowedTypesForListElement: TextElementType[] = [
	TextElementType.LI,
	TextElementType.OL,
	TextElementType.UL
]

const allowedTypesForListItemElement: TextElementType[] = [
	TextElementType.P,
	TextElementType.SPAN,
	TextElementType.I,
	TextElementType.EM,
	TextElementType.B,
	TextElementType.STRONG,
	TextElementType.A,
	TextElementType.BR
]

const allowedTypesForTableElement: TextElementType[] = [
	TextElementType.TBODY,
	TextElementType.TR,
]

const allowedTypesForTableRowElement: TextElementType[] = [
	TextElementType.TH,
	TextElementType.TD
]

const allowedTypesForTableCellElement: TextElementType[] = [
	TextElementType.SPAN,
	TextElementType.I,
	TextElementType.EM,
	TextElementType.B,
	TextElementType.STRONG,
	TextElementType.A,
	TextElementType.BR
]