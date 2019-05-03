import { Component, Renderer2, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data-service';
import { EpubBook } from 'src/app/models/EpubBook';

@Component({
   selector: 'pocketlib-book-content',
   templateUrl: './book-content.component.html',
   styleUrls: [
      './book-content.component.scss'
   ]
})
export class BookContentComponent{
	book = new EpubBook();

	maxPageHeight: number = 500;
	htmlPaddingX: number = 0;
	htmlPaddingY: number = 60;

	currentElement: HTMLElement;
	elementsCount: number = 0;
	currentPosition: number = 0;					// The current position in the chapter html when reading it
	readerPosition: number = 0;					// Indicates the current position in the html when rendering it
	maxHeightReached: boolean = false;			// If true, the currently created page is higher than maxPageHeigh
	lastChildRemoved: boolean = false;			// Indicates if the last child was removed that caused the page to have a heigher height than maxPageHeight
	lastChild: Node = null;

	chapterPages: HtmlChapter[] = [];	// This contains the html for each chapter and each page of each chapter
	currentChapter: number = 0;
	currentPage: number = 0;

	constructor(
		private dataService: DataService,
		private renderer: Renderer2,
      private element: ElementRef,
      private router: Router
	){
		this.dataService.navbarVisible = false;
	}

	async ngOnInit(){
		this.currentElement = this.renderer.createElement("html");
		this.renderer.appendChild(this.element.nativeElement, this.currentElement);
		this.setSize();

		if(this.dataService.currentBook){
			await this.book.ReadEpubFile(this.dataService.currentBook.file);

			for(let i = 0; i < this.book.chapters.length; i++){
				this.chapterPages.push(new HtmlChapter(null));
         }

			await this.ShowPage(0, 0);
		}
	}

	@HostListener('window:resize', ['$event'])
	onResize(event?){
		console.log("height: " + window.innerHeight);
      console.log("width: " + window.innerWidth)
		this.setSize();

		// Update the layout
		this.RerenderCurrentPage();
	}

	setSize(){
		// Calculate the padding of the book html content
		// Left and right padding is 15% of the width
		this.htmlPaddingX = window.innerWidth * 0.15;

		// Set the maxPageHeight
		this.maxPageHeight = window.innerHeight - 2 * this.htmlPaddingY;
	}

	async PrevPage(){
		// Check if the first page is shown
		if(this.currentPage == 0 && this.currentChapter > 0){
			// Show the previous chapter
			this.currentChapter--;
			this.currentPage = this.chapterPages[this.currentChapter].pages.length - 1;
		}else if(this.currentPage > 0){
			// Show the previous page
			this.currentPage--;
		}

		// Render the html
		await this.ShowPage(this.currentChapter, this.currentPage);
	}

	async NextPage(){
		// Check if the last page is shown
		if(this.currentPage == this.chapterPages[this.currentChapter].pages.length - 1){
			// Show the next chapter
			this.currentChapter++;
			this.currentPage = 0;
		}else{
			// Show the next page
			this.currentPage++;
		}

		// Render the html
		await this.ShowPage(this.currentChapter, this.currentPage);
	}

	BookmarkClick(){
		console.log("current chapter: " + this.currentChapter)
		console.log("current page: " + this.currentPage)
		console.log(this.chapterPages)
	}

	async ShowPage(chapter: number, page: number){
		// Check if the chapter exists
		if(chapter >= this.chapterPages.length) return;
		
		if(this.chapterPages[chapter].pages.length == 0){
			// Load the chapter pages
			await this.CreateChapterPages(chapter);
		}

		// Check if the page exists
		if(page >= this.chapterPages[chapter].pages.length) return;
		let currentPage = this.chapterPages[chapter].pages[page];

		// Check if the html of the page must be updated
		if(currentPage.windowHeight != window.innerHeight || currentPage.windowWidth != window.innerWidth){
			// Rerender the html
			this.RerenderCurrentPage();
		}

		// Show the page
		this.SetCurrentElement(this.chapterPages[chapter].pages[page].html)
	}

	async CreateChapterPages(chapter: number){
		// Check if the chapter exists
		if(chapter >= this.book.chapters.length) return;

		// Get the html of the chapter
		let html = await this.book.chapters[chapter].GetChapterHtml();
		this.chapterPages[chapter].html = html.cloneNode(true) as HTMLHtmlElement;

		// Create the pages of the chapter
		let chapterFinished = false;
		this.currentPosition = 0;
		this.elementsCount = 0;

		// Get the elements count
		this.StartCountBodyChildren(html);
		this.chapterPages[chapter].elements = this.elementsCount;

		let head = html.getElementsByTagName("head")[0];
		let body = html.getElementsByTagName("body")[0];

		let newHtml = document.createElement("html");
		let newHead = document.createElement("head");

		// Copy the head to the new head
		for(let i = 0; i < head.childNodes.length; i++){
			newHead.appendChild(head.childNodes.item(i).cloneNode(true));
		}

		newHtml.appendChild(newHead);

		while(!chapterFinished){
			let newHtmlPage = newHtml.cloneNode(true) as HTMLHtmlElement;
			let newBody = document.createElement("body");
			newBody.setAttribute("style", `padding: ${this.htmlPaddingY}px ${this.htmlPaddingX}px; background-color: yellow;`)
			newHtmlPage.appendChild(newBody);
			let currentPagePosition = this.currentPosition;

			this.ResetCurrentElement();
			this.readerPosition = 0;

			this.maxHeightReached = false;
			this.lastChildRemoved = false;
			this.lastChild = null;

			await this.AppendChildren(newBody, body.cloneNode(true), newHtmlPage, true);

			// Add the current html to the chapters array
			this.chapterPages[chapter].pages.push(new HtmlPage(newHtmlPage.cloneNode(true) as HTMLHtmlElement, currentPagePosition, window.innerHeight, window.innerWidth));
			chapterFinished = this.currentPosition >= this.elementsCount;
		}
	}

	AppendChildren(newElement: Node, currentElement: Node, html: HTMLHtmlElement, root: boolean){
		if(this.maxHeightReached){
			if(!this.lastChildRemoved){
				// Remove the last child
				if(this.lastChild && this.lastChild.parentElement){
					this.lastChild.parentElement.removeChild(this.lastChild);
					this.currentPosition--;
					this.readerPosition--;
				}

				this.lastChildRemoved = true;
			}
			return;
		}

		// Go through all children, beginning at the bottom, and add the children if readerPosition >= startPosition
		this.SetCurrentElement(html);

		// Return if the element is text without content
		if(currentElement.nodeType === 3 && currentElement.textContent.trim().length == 0) return;

		if(this.currentElement.offsetHeight > this.maxPageHeight){
			this.maxHeightReached = true;
			return;
		}

		// Go through the children of the current element
		if(currentElement.childNodes.length > 0){
			// Copy the current element without the children
			let newParent = root ? newElement : currentElement.cloneNode(false) as Element;
			if(!root){
				newElement.appendChild(newParent);
				this.lastChild = newParent;

				if(this.readerPosition >= this.currentPosition){
					this.currentPosition++;
				}
				this.readerPosition++;
			}

			for(let i = 0; i < currentElement.childNodes.length; i++){
				// If the child is text, split the text by spaces
				let child = currentElement.childNodes.item(i);

				if(child.nodeType === 3 && child.textContent.trim().length > 0){
					let textParts = child.textContent.split(' ');

					for(let j = 0; j < textParts.length; j++){
						let textPart = textParts[j];
						
						// Append the space to the last element
						if(j != textParts.length) textPart += ' ';
						let textPartNode = document.createTextNode(textPart)
						this.AppendChildren(newParent, textPartNode, html, false);
					}
				}else if(child.nodeType !== 3){
					this.AppendChildren(newParent, child, html, false);
				}
			}
			
			// Remove the element if it has no children
			if(newParent.childNodes.length == 0 && !root && newParent.parentElement){
				newParent.parentElement.removeChild(newParent);
			}
		}else{
			// Add the current element as it has no children
			// Run AppendChildren without adding elements until readerPosition is equals to currentPosition
			if(this.readerPosition >= this.currentPosition){
				let newChild = currentElement.cloneNode(true)
				newElement.appendChild(newChild);
				this.lastChild = newChild;
				this.currentPosition++;
			}

			if(!root) this.readerPosition++;
		}
		
		this.SetCurrentElement(html);
	}

	RerenderCurrentPage(){
		// This is called when the size of the window changed
		// Get the position of the current page
		let position = this.chapterPages[this.currentChapter].pages[this.currentPage].position;
		let chapterHtml = this.chapterPages[this.currentChapter].html;
		let chapterBody = chapterHtml.getElementsByTagName("body")[0];

		// Remove the content of the current element body
		let currentElementHtml = this.currentElement.cloneNode(true) as HTMLHtmlElement;
		let body = currentElementHtml.getElementsByTagName("body")[0];
		body.setAttribute("style", `padding: ${this.htmlPaddingY}px ${this.htmlPaddingX}px; background-color: yellow;`)
		while(body.firstChild) {
			body.removeChild(body.firstChild);
		}
		
		// Start AppendChildren with the empty body
		this.readerPosition = 0;
		this.maxHeightReached = false;
		this.lastChildRemoved = false;
		this.lastChild = null;
		this.currentPosition = position;

		this.AppendChildren(body, chapterBody.cloneNode(true), currentElementHtml, true);

		// Update the html of the current page
		this.chapterPages[this.currentChapter].pages[this.currentPage].html = currentElementHtml.cloneNode(true) as HTMLHtmlElement;

		// Show the new page html
		this.SetCurrentElement(currentElementHtml);

		// Update the windowHeight and windowWidth of the current page
		this.chapterPages[this.currentChapter].pages[this.currentPage].windowHeight = window.innerHeight;
		this.chapterPages[this.currentChapter].pages[this.currentPage].windowWidth = window.innerWidth;

		// Update the position of the next page if there is one
		if(this.chapterPages[this.currentChapter].pages[this.currentPage + 1]){
			this.chapterPages[this.currentChapter].pages[this.currentPage + 1].position = this.currentPosition;
		}else if(this.currentPosition < this.chapterPages[this.currentChapter].elements){
			// Add a new page at the end of the chapter
			this.chapterPages[this.currentChapter].pages.push(new HtmlPage(document.createElement("html"), this.currentPosition, 0, 0));
		}
	}

	StartCountBodyChildren(html: HTMLHtmlElement){
		this.elementsCount = 0;

		let body = html.getElementsByTagName("body")[0];
		this.CountChildren(body, true);
	}

	CountChildren(currentElement: Node, root: boolean){
		if(currentElement.nodeType === 3 && currentElement.textContent.trim().length == 0) return;

		if(currentElement.childNodes.length > 0){
			for(let i = 0; i < currentElement.childNodes.length; i++){
				let child = currentElement.childNodes.item(i);

				// If the child is text, split it by spaces and count the parts
				if(child.nodeType === 3 && child.textContent.trim().length > 0){
					let textParts = child.textContent.split(' ').filter((value: string) => value.trim().length > 0);
					if(!root){
						this.elementsCount += textParts.length;
					}
				}else{
					this.CountChildren(child, false);
				}
			}
		}
		if(!root) this.elementsCount++;
	}
	
	ResetCurrentElement(){
		if(this.currentElement){
			// Remove the children of current element
			while(this.currentElement.firstChild) {
				this.currentElement.removeChild(this.currentElement.firstChild);
			}
		}
	}

	SetCurrentElement(element: HTMLHtmlElement){
		this.ResetCurrentElement();
		
		// Add all children to the element root
		for(let i = 0; i < element.childNodes.length; i++){
			this.currentElement.appendChild(element.childNodes.item(i).cloneNode(true));
		}
	}
   
   //#region Event Handlers
   GoBack(){
      this.router.navigate(["/"])
   }
   //#endregion
}

export class HtmlChapter{
	public pages: HtmlPage[] = [];		// All generated pages of the chapter
	public elements: number = 0;			// The number of elements in the html body

	constructor(
		public html: HTMLHtmlElement			// The html of the entire chapter
	){}
}

export class HtmlPage{
	constructor(
		public html: HTMLHtmlElement,		// The generated html of the page
		public position: number,			// Indicates the position within the chapter
		public windowHeight: number,		// The window height at the time of rendering this page
		public windowWidth: number			// The window width at the time of rendering the page
	){}
}