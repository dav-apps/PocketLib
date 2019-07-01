import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data-service';
import { EpubBook } from 'src/app/models/EpubBook';

const toolbarHeight = 40;				// The height of the toolbar on the top of the page
const secondPageMinWidth = 1050;		// Show two pages on the window if the window width is greater than this

@Component({
	selector: 'pocketlib-book-content',
	templateUrl: './book-content.component.html',
	styleUrls: [
      './book-content.component.scss'
   ]
})
export class BookContentComponent{
	book = new EpubBook();
	chapters: BookChapter[] = [];

	renderDiv: HTMLDivElement;
	viewer: HTMLDivElement;
	width: number = 500;
   height: number = 500;
   paddingX: number = 0;
   paddingY: number = 60;

	//#region Variables for CreatePagesToPosition and AppendChildren
	maxPageHeight: number = 500;
   appendPosition: number = 0;	      // The current position in the chapter html when reading it
   readerPosition: number = 0;	      // Indicates the current position in the html when rendering it
   maxHeightReached: boolean = false;	// If true, the currently created page is higher than maxPageHeight
   lastChildRemoved: boolean = false;	// Indicates if the last child was removed that caused the page to have a heigher height than maxPageHeight
	lastChild: Node = null;					// The last child that was added to the html in AppendChildren
	//#endregion

	constructor(
		private dataService: DataService,
		private router: Router
	){
		this.dataService.navbarVisible = false;
	}

	async ngOnInit(){
		this.renderDiv = document.getElementById("renderDiv") as HTMLDivElement;
		this.viewer = document.getElementById("viewer") as HTMLDivElement;
		this.setSize();

		if(this.dataService.currentBook){
			// Load the ebook
			await this.book.ReadEpubFile(this.dataService.currentBook.file);

			// Create a chapter for each chapter of the book
			this.chapters = [];
			for(let i = 0; i < this.book.chapters.length; i++){
				this.chapters.push(new BookChapter());
			}
			
			await this.ShowPage();
		}
	}

	@HostListener('window:resize')
	onResize(){
		this.setSize();
	}

	setSize(){
		this.width = window.innerWidth;
      this.height = window.innerHeight - toolbarHeight;
      
      // Calculate the padding of the html content
      // Left and right padding is 15% of the width
      this.paddingX = Math.round(window.innerWidth * 0.15);
      if(window.innerWidth > secondPageMinWidth) this.paddingX /= 2;

      this.maxPageHeight = window.innerHeight - 2 * this.paddingY - toolbarHeight;
	}

	async PrevPage(){
		// Check if this is the first chapter
		if(this.dataService.currentBook.chapter == 0) return;

      let chapter = this.chapters[this.dataService.currentBook.chapter];
      let pageIndex = Utils.GetPageByPosition(chapter, this.dataService.currentBook.position);
      
      if(pageIndex == 0){
         // Show the previous chapter
			this.dataService.currentBook.chapter--;
			this.dataService.currentBook.position = this.chapters[this.dataService.currentBook.chapter].elements - 1;
      }else{
			// Update the position to the startPosition of the previous page
			this.dataService.currentBook.position = chapter.pages[pageIndex - 1].startPosition;
		}

		await this.ShowPage();
	}

	async NextPage(){
		let chapter = this.chapters[this.dataService.currentBook.chapter];
		let pageIndex = Utils.GetPageByPosition(chapter, this.dataService.currentBook.position);

		// Update the position to the startPosition of the next page
		this.dataService.currentBook.position = pageIndex == -1 ? 0 : chapter.pages[pageIndex].endPosition + 1;

		if(this.dataService.currentBook.position >= chapter.elements){
			// Show the next chapter as this is the last page
			this.dataService.currentBook.chapter++;
			this.dataService.currentBook.position = 0;
		}
		
		await this.ShowPage();
	}

	// If necessary, generates the pages and then shows the current page, based on the chapter and position of currentBook
	async ShowPage(){
		// Check if the chapter exists
		if(this.dataService.currentBook.chapter >= this.chapters.length) return;
		let chapter = this.chapters[this.dataService.currentBook.chapter];
		let position = this.dataService.currentBook.position;
		
		// Initialize the chapter if necessary
		if(!chapter.IsInitialized()){
			let chapterHtml = await this.book.chapters[this.dataService.currentBook.chapter].GetChapterHtml();
			chapter.Init(chapterHtml);
		}

		// Get the page by the position and if it does not exist, generate the html for the page(s)
		let pageIndex = Utils.GetPageByPosition(chapter, position);
		if(pageIndex == -1){
			// Generate the html for the pages. The last page is then the page of the position
			await this.CreatePagesToPosition(chapter, position);
			pageIndex = chapter.pages.length - 1;
		}

		// TODO Check if the html of the page must be updated

		// Show the page
		let html = Utils.CreatePageHtml(chapter.GetPageTemplate(), chapter.pages[pageIndex].html.cloneNode(true) as HTMLDivElement, window.innerWidth - 2 * this.paddingX, this.paddingX, this.paddingY, false, true);
		this.SetIframeContent(html);
	}

	// Creates all pages up to the given position
	async CreatePagesToPosition(chapter: BookChapter, position: number){
		this.ShowOrHideRenderDiv(false)
		let body = chapter.GetHtml().getElementsByTagName("body")[0];
		if(position >= chapter.elements) position = chapter.elements - 1;
      let lastPosition = chapter.pages.length > 0 ? chapter.pages[chapter.pages.length - 1].endPosition : -1;	// lastPosition should always have endPosition of the last page of the chapter

		while(position > lastPosition){
			// Create the next page
			// Copy the template html
			let pageTemplate = chapter.GetPageTemplate();
         let templateBody = pageTemplate.getElementsByTagName("body")[0];
			let leftPage = templateBody.firstChild as HTMLDivElement;
			leftPage.setAttribute("style", `padding: ${this.paddingY}px ${this.paddingX}px`);
			
			let startPosition = lastPosition + 1;
			this.appendPosition = startPosition;
			this.readerPosition = 0;

			this.ResetRenderDiv();
			this.maxHeightReached = false;
			this.lastChildRemoved = false;
			this.lastChild = null;

			await this.AppendChildren(leftPage, body.cloneNode(true), pageTemplate, true);

			let newPage = new BookPage(leftPage.cloneNode(true) as HTMLDivElement, startPosition, this.appendPosition - 1, window.innerHeight, window.innerWidth);
			chapter.pages.push(newPage);
			lastPosition = newPage.endPosition;
		}
		this.ShowOrHideRenderDiv(true)
	}
	
	ShowOrHideRenderDiv(hide: boolean = true){
		if(hide){
			this.renderDiv.setAttribute("style", "display: none");
		}else{
			this.renderDiv.setAttribute("style", "visibility: hidden");
		}
	}
	
	// Clones the currentElement, which is within rootElement, into the destinationElement and returns when rootElement has reached the max height
   async AppendChildren(destinationElement: Node, currentElement: Node, rootElement: HTMLHtmlElement, root: boolean, endPosition: number = -1){
      if(this.maxHeightReached){
			if(!this.lastChildRemoved){
				// Remove the last child
				if(this.lastChild && this.lastChild.parentElement){
					this.lastChild.parentElement.removeChild(this.lastChild);
					this.appendPosition--;
					this.readerPosition--;
				}

				this.lastChildRemoved = true;
			}
			return;
		}else if(endPosition > 0 && this.appendPosition > endPosition){
			return;
      }
      
      // Go through all children, beginning at the bottom, and add the children if readerPosition >= startPosition
      await this.SetRenderDivContent(rootElement);
      
		// Return if the element is text without content
		if(currentElement.nodeType === 3 && currentElement.textContent.trim().length == 0) return;

		if(this.renderDiv.offsetHeight > this.maxPageHeight){
			this.maxHeightReached = true;
			return;
		}

		// Go through the children of the current element
		if(currentElement.childNodes.length > 0){
			// Copy the current element without the children
			let newParent = root ? destinationElement : currentElement.cloneNode(false) as Element;
			if(!root){
				destinationElement.appendChild(newParent);
				this.lastChild = newParent;

				if(this.readerPosition >= this.appendPosition){
					this.appendPosition++;
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
						await this.AppendChildren(newParent, textPartNode, rootElement, false, endPosition);
					}
				}else if(child.nodeType !== 3){
					await this.AppendChildren(newParent, child, rootElement, false, endPosition);
				}
			}

			// Remove the element if it has no children
			if(newParent.childNodes.length == 0 && !root && newParent.parentElement){
				newParent.parentElement.removeChild(newParent);
			}
		}else{
			// Add the current element as it has no children
			// Run AppendChildren without adding elements until readerPosition is equals to appendPosition
			if(this.readerPosition >= this.appendPosition){
				let newChild = currentElement.cloneNode(true);
				//this.AdaptImageTagDimensions(newChild); TODO
				destinationElement.appendChild(newChild);
				this.lastChild = newChild;
				this.appendPosition++;
			}

			if(!root) this.readerPosition++;
		}

		this.SetRenderDivContent(rootElement);
   }

	ResetRenderDiv(){
		// Remove all children of renderDiv
		while(this.renderDiv.firstChild){
			this.renderDiv.removeChild(this.renderDiv.firstChild);
		}
   }
   
   SetRenderDivContent(html: HTMLHtmlElement){
		this.ResetRenderDiv();
		this.renderDiv.appendChild(html.cloneNode(true));
	}
	
	SetIframeContent(html: HTMLHtmlElement){
		let iframe = this.viewer.firstElementChild as HTMLIFrameElement;
		iframe.srcdoc = html.outerHTML;
	}

	GoBack(){
		this.router.navigate(["/"])
	}
}

class Utils{
	//#region Variables for GetChildrenCount and CountChildren
	private static elementsCount: number = 0;
	//#endregion

	static GetChildrenCount(htmlElement: Node) : number{
		this.elementsCount = 0;
		this.CountChildren(htmlElement, true);
		return this.elementsCount;
	}

	// A recursive function to count the number of elements in the given node and counts up elementsCount
	private static CountChildren(currentElement: Node, root: boolean){
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

	static GetPageByPosition(chapter: BookChapter, position: number) : number{
		if(position >= chapter.elements) position = chapter.elements - 1;
		if(position < 0) position = 0;

		for(let i = 0; i < chapter.pages.length; i++){
			let page = chapter.pages[i];
			
			if(position >= page.startPosition && position <= page.endPosition){
				return i;
			}
		}

		return -1;
	}

	// Inserts the page html into the template html and returns it
	static CreatePageHtml(template: HTMLHtmlElement, page: HTMLDivElement, width: number, paddingX: number, paddingY: number, secondPage: boolean = false, resetOtherPage: boolean = false) : HTMLHtmlElement{
		// Find the div in which the page should be inserted
		let body = template.getElementsByTagName("body")[0];
		let destinationElement = body.children.item(secondPage ? 1 : 0) as HTMLDivElement;
		let otherElement = body.children.item(secondPage ? 0 : 1) as HTMLDivElement;

		if(resetOtherPage){
			// Remove all children from the other page and set width and height to 0
			otherElement.setAttribute("style", "width: 0px; padding: 0px 0px");

			while(otherElement.firstChild){
				otherElement.removeChild(otherElement.firstChild);
			}
		}

		// Set the width and height attributes of the page div
		destinationElement.setAttribute("style", `width: ${width}px; padding: ${paddingY}px ${paddingX - 2}px;`);

		// Insert the page into the template
		for(let i = 0; i < page.childNodes.length; i++){
			destinationElement.appendChild(page.childNodes.item(i).cloneNode(true));
		}

		return template;
	}
}

export class BookChapter{
	private html: HTMLHtmlElement;				// The html of the entire chapter
	private pageTemplate: HTMLHtmlElement;		// The html template where the html content of the pages are being inserted
	public pages: BookPage[] = [];				// All generated pages of the chapter
	public elements: number = 0;					// The number of elements in the html body
	private initialized: boolean = false;		// If true, the html was added, the elements were count and the pageTemplateHtml was created

	Init(html: HTMLHtmlElement){
		this.html = html;
		let head = this.html.getElementsByTagName("head")[0];
		let body = this.html.getElementsByTagName("body")[0];

		// Count the elements in the html
		this.elements = Utils.GetChildrenCount(body);
		
		// Create the template
		let templateHtml = document.createElement("html");
		let templateHead = document.createElement("head");
		let templateBody = document.createElement("body");

		templateHtml.appendChild(templateHead);
		templateHtml.appendChild(templateBody);

		for(let i = 0; i < head.childNodes.length; i++){
			templateHead.appendChild(head.childNodes.item(i).cloneNode(true));
		}

		// Create the divs for the left and the right page
		let leftPage = document.createElement("div");
		let rightPage = document.createElement("div");
		leftPage.setAttribute("id", "leftPage");
		rightPage.setAttribute("id", "rightPage");

		templateBody.appendChild(leftPage);
		templateBody.appendChild(rightPage);

		this.pageTemplate = templateHtml;
		this.initialized = true;
	}

	IsInitialized() : boolean{
		return this.initialized;
	}

	GetHtml() : HTMLHtmlElement{
		return this.html.cloneNode(true) as HTMLHtmlElement;
	}

	GetPageTemplate() : HTMLHtmlElement{
		return this.pageTemplate.cloneNode(true) as HTMLHtmlElement;
	}
}

export class BookPage{
	constructor(
		public html: HTMLDivElement,		// The generated html of the page, which is inserted into the pageTemplateHtml of the chapter
		public startPosition: number,		// Indicates where the current page begins in the chapter html
		public endPosition: number,		// The html between startPosition and the endPosition is the html of this page; The last page of the chapter has the endPosition chapter.elements - 1
		public windowHeight: number,		// The window height at the time of rendering the page
		public windowWidth: number			// The window width at the time of rendering the page
	){}
}