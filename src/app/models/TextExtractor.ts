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
			if (textElement.Content) headerElement.innerText = textElement.Content.trim()
			return headerElement
		case TextElementType.P:
			let pElement = document.createElement("p") as HTMLParagraphElement
			if (textElement.Id) pElement.id = textElement.Id

			if (textElement.TextElements) {
				for (let innerTextElement of textElement.TextElements) {
					pElement.appendChild(CreateHtmlElementFromTextElement(innerTextElement))
				}
			}

			return pElement
		case TextElementType.SPAN:
			let spanElement = document.createElement("span") as HTMLSpanElement
			if (textElement.Id) spanElement.id = textElement.Id
			if (textElement.Content) spanElement.innerHTML = textElement.Content.replace(/ /g, '<span> </span>')
			return spanElement
		case TextElementType.EM:
			let emElement = document.createElement("em") as HTMLElement
			if (textElement.Id) emElement.id = textElement.Id
			if (textElement.Content) emElement.innerHTML = textElement.Content.replace(/ /g, '<span> </span>')
			return emElement
		case TextElementType.STRONG:
			let strongElement = document.createElement("strong") as HTMLElement
			if (textElement.Id) strongElement.id = textElement.Id
			if (textElement.Content) strongElement.innerHTML = textElement.Content.replace(/ /g, '<span> </span>')
			return strongElement
		case TextElementType.A:
			let aElement = document.createElement("a") as HTMLAnchorElement
			if (textElement.Id) aElement.id = textElement.Id
			if (textElement.Content) aElement.innerText = textElement.Content
			if (textElement.Href != null) aElement.setAttribute("href", textElement.Href)
			return aElement
		case TextElementType.IMG:
			let imgElement = document.createElement("img") as HTMLImageElement
			if (textElement.Id) imgElement.id = textElement.Id
			imgElement.setAttribute("src", textElement.Source)
			if (textElement.Alt != null) imgElement.setAttribute("alt", textElement.Alt)
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
					listElement.appendChild(CreateHtmlElementFromTextElement(innerTextElement))
				}
			}

			return listElement
		case TextElementType.LI:
			let liElement = document.createElement("li") as HTMLLIElement
			if (textElement.Id) liElement.id = textElement.Id
			
			if (textElement.TextElements) {
				for (let innerTextElement of textElement.TextElements) {
					liElement.appendChild(CreateHtmlElementFromTextElement(innerTextElement))
				}
			}

			return liElement
		case TextElementType.HR:
			let hrElement = document.createElement("hr") as HTMLHRElement
			if (textElement.Id) hrElement.id = textElement.Id
			hrElement.setAttribute("style", "margin: 4em 0")
			return hrElement
		case TextElementType.BR:
			let brElement = document.createElement("br") as HTMLBRElement
			if (textElement.Id) brElement.id = textElement.Id
			return brElement
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
			if(i == -1) return textElements
		}

		switch (node.nodeName) {
			case "H1":
			case "H2":
			case "H3":
			case "H4":
			case "H5":
			case "H6":
				textElements.push(...ExtractHeaderTextElements(node as HTMLHeadingElement, parentElement))
				break
			case "P":
				let pElement = node as HTMLParagraphElement
				let pTextElement: TextElement = {
					Type: TextElementType.P,
					Id: pElement.id,
					ParentElement: parentElement
				}

				pTextElement.TextElements = GetInnerTextElements(pElement, pTextElement, allowedTypes ? allowedTypes : [TextElementType.IMG])
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
			case "EM":
				let emElement = node as HTMLElement
				let emTextContent = emElement.textContent.trim()

				if (emTextContent.length > 0) {
					textElements.push({
						Type: TextElementType.EM,
						Id: emElement.id,
						Content: emTextContent,
						ParentElement: parentElement
					})
				}
				break
			case "STRONG":
				let strongElement = node as HTMLElement
				let strongTextContent = strongElement.textContent.trim()

				if (strongTextContent.length > 0) {
					textElements.push({
						Type: TextElementType.STRONG,
						Id: strongElement.id,
						Content: strongTextContent,
						ParentElement: parentElement
					})
				}
				break
			case "A":
				let aElement = node as HTMLAnchorElement

				// Check if the element contains text nodes
				let containsText = false
				
				for (let i = 0; i < aElement.childNodes.length; i++) {
					let childNode = aElement.childNodes.item(0)

					if (
						childNode.nodeType == Node.TEXT_NODE
						&& childNode.textContent.trim().length > 0
					) {
						containsText = true
						break
					}

					if (
						childNode.nodeType == Node.ELEMENT_NODE
						&& childNode.nodeName == "SPAN"
						&& childNode.textContent.trim().length > 0
					) {
						containsText = true
						break
					}
				}

				if (containsText) {
					// Add the element as an a tag
					textElements.push({
						Type: TextElementType.A,
						Id: aElement.id,
						Content: aElement.textContent,
						Href: aElement.getAttribute("href"),
						ParentElement: parentElement
					})
				} else {
					// Add the child elements
					for (let i = 0; i < node.childNodes.length; i++) {
						let childNode = node.childNodes.item(i)
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

				// Get the list items
				let olElementListItemElements = olElement.getElementsByTagName("li")
				let olTextElementListItemElements: TextElement[] = []
				let olTextElement: TextElement = {
					Type: TextElementType.OL,
					Id: olElement.id,
					ParentElement: parentElement
				}

				for (let i = 0; i < olElementListItemElements.length; i++) {
					let listItemElement = olElementListItemElements.item(i)
					let listItemTextElement: TextElement = {
						Type: TextElementType.LI,
						Id: listItemElement.id,
						ParentElement: olTextElement
					}

					listItemTextElement.TextElements = GetInnerTextElements(listItemElement, listItemTextElement)
					olTextElementListItemElements.push(listItemTextElement)
				}

				olTextElement.TextElements = olTextElementListItemElements
				textElements.push(olTextElement)
				break
			case "UL":
				let ulElement = node as HTMLUListElement

				// Get the list items
				let ulElementListItemElements = ulElement.getElementsByTagName("li")
				let ulTextElementListItemElements: TextElement[] = []
				let ulTextElement: TextElement = {
					Type: TextElementType.UL,
					Id: ulElement.id,
					ParentElement: parentElement
				}

				for (let i = 0; i < ulElementListItemElements.length; i++){
					let listItemElement = ulElementListItemElements.item(i)
					let listItemTextElement: TextElement = {
						Type: TextElementType.LI,
						Id: listItemElement.id,
						ParentElement: ulTextElement
					}

					listItemTextElement.TextElements = GetInnerTextElements(listItemElement, listItemTextElement)
					ulTextElementListItemElements.push(listItemTextElement)
				}

				ulTextElement.TextElements = ulTextElementListItemElements
				textElements.push(ulTextElement)
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

function ExtractHeaderTextElements(headerElement: HTMLHeadingElement, parentElement?: TextElement): TextElement[] {
	let textElements: TextElement[] = []
	if (headerElement == null) return textElements

	// Extract text and img tags
	let textContent = headerElement.textContent.trim()
	let imgElements = headerElement.getElementsByTagName("img")

	// Get the element type
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

	// Add the text
	textElements.push({
		Type: type,
		Id: headerElement.id,
		Content: textContent,
		ParentElement: parentElement
	})

	// Get all children with an id
	let idNodes = headerElement.querySelectorAll("* > [id]")

	// Add an empty span for each id node
	for (let i = 0; i < idNodes.length; i++) {
		textElements.push({
			Type: TextElementType.SPAN,
			Id: idNodes.item(i).id,
			ParentElement: parentElement
		})
	}

	// Add all image elements
	for (let i = 0; i < imgElements.length; i++) {
		let imgElement = imgElements.item(i)

		textElements.push({
			Type: TextElementType.IMG,
			Source: imgElement.getAttribute("src"),
			Alt: imgElement.getAttribute("alt"),
			ParentElement: parentElement
		})
	}

	return textElements
}

function GetInnerTextElements(
	node: Node,
	parentElement: TextElement,
	additionalAllowedTypes: TextElementType[] = []
): TextElement[] {
	let textElements: TextElement[] = []

	let allowedTypes: TextElementType[] = [
		TextElementType.P,
		TextElementType.SPAN,
		TextElementType.EM,
		TextElementType.STRONG,
		TextElementType.A,
		TextElementType.BR
	]

	// Add the additional types to the allowed types
	for (let type of additionalAllowedTypes) {
		if (!allowedTypes.includes(type)) {
			allowedTypes.push(type)
		}
	}

	for (let i = 0; i < node.childNodes.length; i++){
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

		if (
			currentElement.Type == TextElementType.P
			|| currentElement.Type == TextElementType.EM
			|| currentElement.Type == TextElementType.STRONG
			|| currentElement.Type == TextElementType.A
			|| currentElement.Type == TextElementType.IMG
			|| currentElement.Type == TextElementType.BR
		) {
			mergedTextElements.push(currentElement)
		} else if (
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

export interface TextElement {
	Type: TextElementType
	Id?: string
	Content?: string
	Href?: string
	Source?: string
	Alt?: string
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
	EM = "EM",
	STRONG = "STRONG",
	A = "A",
	IMG = "IMG",
	UL = "UL",
	OL = "OL",
	LI = "LI",
	HR = "HR",
	BR = "BR"
}