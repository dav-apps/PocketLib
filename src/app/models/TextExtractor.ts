export function CreateHtmlElementFromTextElement(textElement: TextElement): HTMLElement {
	switch (textElement.Type) {
		case TextElementType.H1:
		case TextElementType.H2:
		case TextElementType.H3:
		case TextElementType.H4:
		case TextElementType.H5:
		case TextElementType.H6:
			let headerElement = document.createElement(textElement.Type) as HTMLHeadingElement
			headerElement.setAttribute("style", "text-align: center; margin-top: 2em; margin-bottom: 2em; font-weight: 300")
			headerElement.innerText = textElement.Content.trim()
			return headerElement
		case TextElementType.P:
			let pElement = document.createElement("p") as HTMLParagraphElement

			if (textElement.TextElements) {
				for (let innerTextElement of textElement.TextElements) {
					pElement.appendChild(CreateHtmlElementFromTextElement(innerTextElement))
				}
			}

			return pElement
		case TextElementType.SPAN:
			let spanElement = document.createElement("span") as HTMLSpanElement
			spanElement.innerHTML = textElement.Content.replace(/ /g, '<span> </span>')
			return spanElement
		case TextElementType.EM:
			let emElement = document.createElement("em") as HTMLElement
			emElement.innerHTML = textElement.Content.replace(/ /g, '<span> </span>')
			return emElement
		case TextElementType.STRONG:
			let strongElement = document.createElement("strong") as HTMLElement
			strongElement.innerHTML = textElement.Content.replace(/ /g, '<span> </span>')
			return strongElement
		case TextElementType.A:
			let aElement = document.createElement("a") as HTMLAnchorElement
			aElement.innerText = textElement.Content
			if (textElement.Href != null) aElement.setAttribute("href", textElement.Href)
			return aElement
		case TextElementType.IMG:
			let imgElement = document.createElement("img") as HTMLImageElement
			imgElement.setAttribute("src", textElement.Source)
			if (textElement.Alt != null) imgElement.setAttribute("alt", textElement.Alt)
			imgElement.setAttribute("style", "text-align: center")

			let imgContainerElement = document.createElement("div")
			imgContainerElement.setAttribute("style", "display: flex; justify-content: center; margin-top: 2em; margin-bottom: 2em")
			imgContainerElement.appendChild(imgElement)

			return imgContainerElement
		case TextElementType.OL:
			let olElement = document.createElement("ol") as HTMLUListElement
		case TextElementType.UL:
			let ulElement = document.createElement("ul") as HTMLOListElement
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
			hrElement.setAttribute("style", "margin: 4em 0")
			return hrElement
		case TextElementType.BR:
			let brElement = document.createElement("br") as HTMLBRElement
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
					if (
						selectedTextElements[0].Type == TextElementType.IMG
						|| selectedTextElements[0].Type == TextElementType.BR
						|| selectedTextElements[0].Type == TextElementType.EM
						|| selectedTextElements[0].Type == TextElementType.STRONG
					) {
						mergedTextElements.push(selectedTextElements[0])
					} else if (
						mergedTextElements.length > 0
						&& mergedTextElements[mergedTextElements.length - 1].Type == TextElementType.P
					) {
						// Add the text of the current selected element to the last element of mergedTextElements
						mergedTextElements[mergedTextElements.length - 1].Content += " " + selectedTextElements[0].Content
					} else {
						// Add new text element
						mergedTextElements.push({
							Type: TextElementType.SPAN,
							Content: selectedTextElements[0].Content
						})
					}

					selectedTextElements.splice(0, 1)
				}

				textElements.push({
					Type: TextElementType.P,
					TextElements: mergedTextElements
				})
				break
			case "SPAN":
				let spanTextContent = node.textContent.trim()

				if (spanTextContent.length > 0) {
					textElements.push({
						Type: TextElementType.SPAN,
						Content: spanTextContent
					})
				}
				break
			case "EM":
				let emTextContent = node.textContent.trim()

				if (emTextContent.length > 0) {
					textElements.push({
						Type: TextElementType.EM,
						Content: emTextContent
					})
				}
				break
			case "STRONG":
				let strongTextContent = node.textContent.trim()

				if (strongTextContent.length > 0) {
					textElements.push({
						Type: TextElementType.STRONG,
						Content: strongTextContent
					})
				}
				break
			case "A":
				let aElement = node as HTMLAnchorElement

				textElements.push({
					Type: TextElementType.A,
					Content: aElement.textContent,
					Href: aElement.getAttribute("href")
				})
				break
			case "IMG":
				let imgElement = node as HTMLImageElement

				textElements.push({
					Type: TextElementType.IMG,
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
					ListItems: ulListItems
				})
				break
			case "HR":
				textElements.push({
					Type: TextElementType.HR
				})
				break
			case "BR":
				textElements.push({
					Type: TextElementType.BR
				})
				break
			default:
				for (let i = 0; i < node.childNodes.length; i++) {
					let childNode = node.childNodes.item(i)
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

	textElements.push({
		Type: type,
		Content: textContent
	})

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