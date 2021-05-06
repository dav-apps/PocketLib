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
			imgContainerElement.setAttribute("style", "display: flex; justify-content: center; margin-top: 2em; margin-bottom: 2em")
			imgContainerElement.appendChild(imgElement)

			return imgContainerElement
		case TextElementType.OL:
			let olElement = document.createElement("ol") as HTMLUListElement
			if (textElement.Id) olElement.id = textElement.Id
		case TextElementType.UL:
			let ulElement = document.createElement("ul") as HTMLOListElement
			if (textElement.Id) ulElement.id = textElement.Id
			let listElement = textElement.Type == TextElementType.OL ? olElement : ulElement

			if (textElement.ListItems) {
				for (let listItem of textElement.ListItems) {
					let liElement = document.createElement("li") as HTMLLIElement
					liElement.innerText = listItem
					listElement.appendChild(liElement)
				}
			}

			return listElement
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

export function ExtractTextElements(node: Node): TextElement[] {
	let textElements: TextElement[] = []

	if (node.nodeType == Node.TEXT_NODE) {
		let textContent = node.textContent

		if (textContent.length > 0) {
			textElements.push({
				Type: TextElementType.SPAN,
				Content: textContent
			})
		}
	} else if (node.nodeType == Node.ELEMENT_NODE) {
		switch (node.nodeName) {
			case "H1":
			case "H2":
			case "H3":
			case "H4":
			case "H5":
			case "H6":
				textElements.push(...ExtractHeaderTextElements(node as HTMLHeadingElement))
				break
			case "P":
				let pElement = node as HTMLParagraphElement
				let pTextElements: TextElement[] = []

				for (let i = 0; i < node.childNodes.length; i++) {
					let childNode = node.childNodes.item(i)
					pTextElements.push(...ExtractTextElements(childNode))
				}

				// Select text and image elements
				let selectedTextElements = pTextElements.filter(element =>
					element.Type == TextElementType.P
					|| element.Type == TextElementType.SPAN
					|| element.Type == TextElementType.EM
					|| element.Type == TextElementType.STRONG
					|| element.Type == TextElementType.A
					|| element.Type == TextElementType.IMG
					|| element.Type == TextElementType.BR
				)

				// Merge adjourning text elements
				let mergedTextElements: TextElement[] = []

				while (selectedTextElements.length > 0) {
					let currentElement = selectedTextElements[0]

					if (
						currentElement.Type == TextElementType.IMG
						|| currentElement.Type == TextElementType.BR
						|| currentElement.Type == TextElementType.EM
						|| currentElement.Type == TextElementType.STRONG
					) {
						mergedTextElements.push(currentElement)
					} else if (
						mergedTextElements.length > 0
						&& mergedTextElements[mergedTextElements.length - 1].Type == TextElementType.P
					) {
						// Add the text of the current selected element to the last element of mergedTextElements
						mergedTextElements[mergedTextElements.length - 1].Content += " " + currentElement.Content
					} else {
						// Add new text element
						mergedTextElements.push({
							Type: TextElementType.SPAN,
							Id: currentElement.Id,
							Content: currentElement.Content
						})
					}

					selectedTextElements.splice(0, 1)
				}

				textElements.push({
					Type: TextElementType.P,
					Id: pElement.id,
					TextElements: mergedTextElements
				})
				break
			case "SPAN":
				let spanElement = node as HTMLSpanElement
				let spanTextContent = spanElement.textContent.trim()

				if (spanTextContent.length > 0) {
					textElements.push({
						Type: TextElementType.SPAN,
						Id: spanElement.id,
						Content: spanTextContent
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
						Content: emTextContent
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
						Content: strongTextContent
					})
				}
				break
			case "A":
				let aElement = node as HTMLAnchorElement

				// Check if the element contains text nodes
				let aElementText = ""
				for (let i = 0; i < aElement.childNodes.length; i++) {
					if (aElement.childNodes.item(i).nodeType == Node.TEXT_NODE) {
						aElementText += aElement.childNodes.item(i).textContent.trim()
					}
				}

				if (aElementText.length == 0) {
					// Go through and add the child elements
					for (let i = 0; i < node.childNodes.length; i++) {
						let childNode = node.childNodes.item(i)
						textElements.push(...ExtractTextElements(childNode))
					}
				} else {
					// Add the element as an a tag
					textElements.push({
						Type: TextElementType.A,
						Id: aElement.id,
						Content: aElement.textContent,
						Href: aElement.getAttribute("href")
					})
				}
				break
			case "IMG":
				let imgElement = node as HTMLImageElement

				textElements.push({
					Type: TextElementType.IMG,
					Id: imgElement.id,
					Source: imgElement.getAttribute("src"),
					Alt: imgElement.getAttribute("alt")
				})
				break
			case "OL":
				let olElement = node as HTMLOListElement

				// Get the list items
				let olListItemElements = olElement.getElementsByTagName("li")
				let olListItems: string[] = []

				for (let i = 0; i < olListItemElements.length; i++) {
					olListItems.push(olListItemElements.item(i).textContent.trim())
				}

				textElements.push({
					Type: TextElementType.OL,
					Id: olElement.id,
					ListItems: olListItems
				})
				break
			case "UL":
				let ulElement = node as HTMLUListElement

				// Get the list items
				let ulListItemElements = ulElement.getElementsByTagName("li")
				let ulListItems: string[] = []

				for (let i = 0; i < ulListItemElements.length; i++) {
					ulListItems.push(ulListItemElements.item(i).textContent.trim())
				}

				textElements.push({
					Type: TextElementType.UL,
					Id: ulElement.id,
					ListItems: ulListItems
				})
				break
			case "HR":
				textElements.push({
					Type: TextElementType.HR,
					Id: (node as HTMLHRElement).id
				})
				break
			case "BR":
				textElements.push({
					Type: TextElementType.BR,
					Id: (node as HTMLBRElement).id
				})
				break
			default:
				let element = node as HTMLElement
				if (element.id) {
					// Add empty span element with the id
					textElements.push({
						Type: TextElementType.SPAN,
						Id: element.id
					})
				}

				for (let i = 0; i < element.childNodes.length; i++) {
					let childNode = element.childNodes.item(i)
					textElements.push(...ExtractTextElements(childNode))
				}
				break
		}
	}

	return textElements
}

function ExtractHeaderTextElements(headerElement: HTMLHeadingElement): TextElement[] {
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
		Content: textContent
	})

	// Get all children with an id
	let idNodes = headerElement.querySelectorAll("* > [id]")

	// Add an empty span for each id node
	for (let i = 0; i < idNodes.length; i++) {
		textElements.push({
			Type: TextElementType.SPAN,
			Id: idNodes.item(i).id
		})
	}

	// Add all image elements
	for (let i = 0; i < imgElements.length; i++) {
		let imgElement = imgElements.item(i)

		textElements.push({
			Type: TextElementType.IMG,
			Source: imgElement.getAttribute("src"),
			Alt: imgElement.getAttribute("alt")
		})
	}

	return textElements
}

export interface TextElement {
	Type: TextElementType
	Id?: string
	Content?: string
	Href?: string
	Source?: string
	Alt?: string
	ListItems?: string[]
	TextElements?: TextElement[]
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
	HR = "HR",
	BR = "BR"
}