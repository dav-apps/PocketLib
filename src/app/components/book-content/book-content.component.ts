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
	chapterFinished: boolean = false;
	chapterElements: number = 0;
	currentPosition: number = 0;
	readerPosition: number = 0;

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
			this.LoadPage();
		}
	}

	async PrevPage(){
		if(this.dataService.currentChapter > 0){
			this.dataService.currentChapter--;
			this.currentPosition = 0;

			await this.LoadPage();
		}
	}

	async NextPage(){
		if(this.chapterFinished){
			if(this.book.chapters.length > this.dataService.currentChapter + 1){
				this.dataService.currentChapter++;
				this.currentPosition = 0;
	
				await this.LoadChapter();
				this.LoadPage();
			}
		}else{
			this.currentPosition++;
			this.LoadPage();
		}
	}
	
	async LoadChapter(){
		this.chapterFinished = false;
		this.chapterElements = 0;
		this.currentPosition = 0;

		this.chapterHtmlElement = await this.book.chapters[this.dataService.currentChapter].GetChapterHtml();
	}
   
   LoadPage(){
      let head = this.chapterHtmlElement.getElementsByTagName("head")[0];
		let body = this.chapterHtmlElement.getElementsByTagName("body")[0];

		let newHtml = document.createElement("html");
		
      let newHead = document.createElement("head");
		newHead.innerHTML = head.innerHTML;
		newHtml.appendChild(newHead);
		
		let newBody = document.createElement("body");
		newHtml.appendChild(newBody);

		this.currentElement.innerHTML = newHtml.outerHTML;
		this.chapterElements = 0;

		this.readerPosition = 0;
		this.AppendChildren(newBody, body.cloneNode(true), newHtml, true);

		console.log(newBody)
		console.log("Position: " + this.currentPosition);
		console.log("Elements: " + this.chapterElements);

		if(this.chapterElements == this.currentPosition){
			this.chapterFinished = true;
		}
		console.log("Chapter finished: " + this.chapterFinished)
	}

	AppendChildren(newElement: Node, currentElement: Node, html: HTMLHtmlElement, root: boolean){
		console.log("Reader position: " + this.readerPosition + ", Position: " + this.currentPosition);

		this.currentElement.innerHTML = html.innerHTML;

		// Return if the element is text without content
		if(currentElement.nodeType === 3 && currentElement.textContent.trim().length == 0) return;

		if(!root) this.chapterElements++;

		//console.log(this.currentElement.offsetHeight);
		if(this.currentElement.offsetHeight > 500) return;

		if(!root){
			if(this.readerPosition >= this.currentPosition){
				this.currentPosition++;
			}
			this.readerPosition++;
		}

		// Go through the children of the current element
		if(currentElement.childNodes.length > 0){
			// Copy the current element without the children
			let e = currentElement.cloneNode(false) as Element;
			if(!root) newElement.appendChild(e);

			for(let i = 0; i < currentElement.childNodes.length; i++){
				this.AppendChildren(root ? newElement : e, currentElement.childNodes.item(i), html, false);
			}

			// Remove the element if the readerPosition is still < currentPosition
			if(this.readerPosition < this.currentPosition){
				newElement.removeChild(e);
			}
		}else{
			// Add the current element as it has no children
			// Run AppendChildren without adding elements until readerPosition is equals to currentPosition
			if(this.readerPosition >= this.currentPosition){
				newElement.appendChild(currentElement.cloneNode(true));
			}
		}
	}
}