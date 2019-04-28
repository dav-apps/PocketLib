import { Component, Renderer2, ElementRef } from '@angular/core';
import { DataService } from 'src/app/services/data-service';
import { EpubBook } from 'src/app/models/EpubBook';

@Component({
   selector: 'pocketlib-book-content',
   templateUrl: './book-content.component.html'
})
export class BookContentComponent{
	book = new EpubBook();
	chapterHtmlElement: HTMLHtmlElement;
	currentElement: HTMLElement;
	elementsCount: number = 0;
	chapterFinished: boolean = false;
	startPosition: number = 0;		// Where the currently displayed html starts in the chapter html
	endPosition: number = 0;		// Where the currently displayed html ends in the chapter html
	readerPosition: number = 0;	// Indicates the current position in the html when rendering it

	constructor(
		private dataService: DataService,
		private renderer: Renderer2,
		private element: ElementRef
	){}

	async ngOnInit(){
		this.currentElement = this.renderer.createElement("html");
		this.renderer.appendChild(this.element.nativeElement, this.currentElement);

		if(this.dataService.currentBook){
			await this.book.ReadEpubFile(this.dataService.currentBook.file);
			await this.LoadChapter();
			this.RenderHtml(false);
		}
	}

	async PrevPage(){
		if(this.startPosition == 0){
			// Go to the last page of the previous chapter
			if(this.dataService.currentChapter > 0){
				this.dataService.currentChapter--;
				await this.LoadChapter();
				this.RenderHtml(true);
			}
		}else{
			// Show the previous page
			// Before:      		 abcde [f]ghi[j]		startPos: 5, endPos: 9
			// Before RenderHtml: abcd[e] fghij			startPos: 4, endPos: 4
			// After RenderHtml:  [a]bcd[e] fghij		startPos: 0, endPos: 4
			this.startPosition--;
			this.endPosition = this.startPosition;
			this.RenderHtml(true);
		}
	}

	async NextPage(){
		if(this.chapterFinished){
			if(this.book.chapters.length > this.dataService.currentChapter + 1){
				this.dataService.currentChapter++;
				await this.LoadChapter();
				this.RenderHtml(false);
			}
		}else{
			// Before:      		 [a]bcd[e] fghij		startPos: 0, endPos: 4
			// Before RenderHtml: abcde [f]ghij			startPos: 5, endPos: 5
			// After RenderHtml:  abcde [f]ghi[j]		startPos: 5, endPos: 9
			this.endPosition++;
			this.startPosition = this.endPosition;
			this.RenderHtml(false);
		}
	}
	
	async LoadChapter(){
		this.chapterFinished = false;
		this.readerPosition = 0;
		this.startPosition = 0;
		this.endPosition = 0;

		this.chapterHtmlElement = await this.book.chapters[this.dataService.currentChapter].GetChapterHtml();

		this.StartCountBodyChildren()
		console.log("Elements count: " + this.elementsCount)
	}
   
   RenderHtml(backwards: boolean){
      let head = this.chapterHtmlElement.getElementsByTagName("head")[0];
		let body = this.chapterHtmlElement.getElementsByTagName("body")[0];

		let newHtml = document.createElement("html");
		
      let newHead = document.createElement("head");
		newHead.innerHTML = head.innerHTML;
		newHtml.appendChild(newHead);
		
		let newBody = document.createElement("body");
		newHtml.appendChild(newBody);

		this.currentElement.innerHTML = newHtml.outerHTML;

		if(backwards){
			console.log("StartPosition before Prepend: " + this.startPosition)
			console.log("EndPosition before Prepend: " + this.endPosition)
			
			this.readerPosition = this.elementsCount;
			this.PrependChildren(newBody, body.cloneNode(true), newHtml, true);
		}else{
			this.readerPosition = 0;
			this.AppendChildren(newBody, body.cloneNode(true), newHtml, true);
		}

		console.log("Entire chapter: ")
		console.log(body)
		console.log("Modified chapter: ")
		console.log(newBody);

		this.chapterFinished = this.endPosition >= this.elementsCount;
		console.log("Chapter finished: " + this.chapterFinished)

		console.log("Start position: " + this.startPosition);
		console.log("End position: " + this.endPosition);
		console.log("ReaderPosition: " + this.readerPosition)
	}

	AppendChildren(newElement: Node, currentElement: Node, html: HTMLHtmlElement, root: boolean){
		// Go through all children, beginning at the bottom, and add the children if readerPosition >= startPosition
		//console.log("Reader position: " + this.readerPosition + ", Position: " + this.currentPosition + ", Total count: " + this.elementsCount);

		this.currentElement.innerHTML = html.innerHTML;

		// Return if the element is text without content
		if(currentElement.nodeType === 3 && currentElement.textContent.trim().length == 0) return;

		console.log("AppendChildren")
		console.log(currentElement)
		console.log("start position: " + this.startPosition + " end position: " + this.endPosition + " reader position: " + this.readerPosition)

		if(this.currentElement.offsetHeight > 300) return;

		// Go through the children of the current element
		if(currentElement.childNodes.length > 0){
			// Copy the current element without the children
			let newParent = root ? newElement : currentElement.cloneNode(false) as Element;
			if(!root){
				newElement.appendChild(newParent);

				if(this.readerPosition >= this.startPosition){
					this.endPosition++;
					console.log("Append1")
				}
				this.readerPosition++;
			}

			for(let i = 0; i < currentElement.childNodes.length; i++){
				this.AppendChildren(newParent, currentElement.childNodes.item(i), html, false);
			}

			// Remove the element if it has no children
			if(newParent.childNodes.length == 0 && !root){
				console.log("Remove child")
				newParent.parentElement.removeChild(newParent);
			}
		}else{
			// Add the current element as it has no children
			// Run AppendChildren without adding elements until readerPosition is equals to currentPosition
			if(!root) this.readerPosition++;

			if(this.readerPosition >= this.startPosition){
				console.log("Append2")
				newElement.appendChild(currentElement.cloneNode(true));
				this.endPosition++;
			}
		}
	}

	PrependChildren(newElement: Node, currentElement: Node, html: HTMLHtmlElement, root: boolean){
		// Go through all children, beginning at the bottom, and add the children if readerPosition <= endPosition

		//console.log("Reader position2: " + this.readerPosition + ", Position: " + this.currentPosition);

		this.currentElement.innerHTML = html.innerHTML;

		// Return if the element is text without content
		if(currentElement.nodeType === 3 && currentElement.textContent.trim().length == 0) return;

		console.log("PrependChildren")
		console.log(currentElement)

		if(this.currentElement.offsetHeight > 300) return;

		// Go through the children of the current element, starting from the end
		if(currentElement.childNodes.length > 0){
			// Copy the current element without the children
			let newParent = root ? newElement : currentElement.cloneNode(false) as Element;
			if(!root){
				if(newElement.childNodes.length > 0) newElement.insertBefore(newParent, newElement.childNodes.item(0));
				else newElement.appendChild(newParent);
				console.log("Reader pos2: " + this.readerPosition)

				if(this.readerPosition < this.endPosition){
					this.startPosition--;
				}
				this.readerPosition--;
			}

			for(let i = currentElement.childNodes.length - 1; i >= 0; i--){
				this.PrependChildren(newParent, currentElement.childNodes.item(i), html, false);
			}

			// Remove the element if it has no children
			if(newParent.childNodes.length == 0 && !root){
				newParent.parentElement.removeChild(newParent);
			}
		}else{
			// Add the current element as it has no children
			// Run PrependChildren without adding elements until readerPosition is smaller than currentPosition
			console.log("Reader pos: " + this.readerPosition)

			if(this.readerPosition < this.endPosition){
				console.log("Add element")
				let e = currentElement.cloneNode(true);
				//if(newElement.childNodes.length > 0) newElement.insertBefore(e, newElement.childNodes.item(0))
				//else newElement.appendChild(e);
				newElement.appendChild(e);
				
				this.startPosition--;
			}

			if(!root) this.readerPosition--;
		}
	}

	StartCountBodyChildren(){
		this.elementsCount = 0;

		let body = this.chapterHtmlElement.getElementsByTagName("body")[0];
		this.CountChildren(body, true);
	}

	CountChildren(currentElement: Node, root: boolean){
		if(currentElement.nodeType === 3 && currentElement.textContent.trim().length == 0) return;

		if(currentElement.childNodes.length > 0){
			for(let i = 0; i < currentElement.childNodes.length; i++){
				this.CountChildren(currentElement.childNodes.item(i), false);
			}
		}
		if(!root) this.elementsCount++;
	}
}