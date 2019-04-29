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
	chapterHtmlElement: HTMLHtmlElement;
	maxPageHeight: number = 500;
	currentElement: HTMLElement;
	elementsCount: number = 0;
	currentPosition: number = 0;					// The current position in the chapter html when reading it
	readerPosition: number = 0;					// Indicates the current position in the html when rendering it
	chapterPages: HTMLHtmlElement[][] = [];	// This contains the html for each page of each chapter
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

		if(this.dataService.currentBook){
			await this.book.ReadEpubFile(this.dataService.currentBook.file);

			for(let i = 0; i < this.book.chapters.length; i++){
				this.chapterPages.push([]);
			}

			await this.ShowPage(0, 0);
		}
	}

	@HostListener('window:resize', ['$event'])
	onResize(event?){
		console.log("Resize!")
		console.log("height: " + window.innerHeight);
      console.log("width: " + window.innerWidth)
      console.log("Element width: " + this.currentElement.clientWidth)
	}

	setSize(){
		
	}

	async PrevPage(){
		// Check if the first page is shown
		if(this.currentPage == 0 && this.currentChapter > 0){
			// Show the previous chapter
			this.currentChapter--;
			this.currentPage = this.chapterPages[this.currentChapter].length - 1;
		}else if(this.currentPage > 0){
			// Show the previous page
			this.currentPage--;
		}

		// Render the html
		await this.ShowPage(this.currentChapter, this.currentPage);
	}

	async NextPage(){
		// Check if the last page is shown
		if(this.currentPage == this.chapterPages[this.currentChapter].length - 1){
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

	async ShowPage(chapter: number, page: number){
		// Check if the chapter exists
		if(chapter >= this.chapterPages.length) return;
		
		if(this.chapterPages[chapter].length == 0){
			// Load the chapter pages
			await this.CreateChapterPages(chapter);
		}

		// Check if the page exists
		if(page >= this.chapterPages[chapter].length) return;

		// Show the page
		this.currentElement.innerHTML = this.chapterPages[chapter][page].innerHTML;
	}

	async CreateChapterPages(chapter: number){
		// Check if the chapter exists
		if(chapter >= this.book.chapters.length) return;

		// Get the html of the chapter
		let html = await this.book.chapters[chapter].GetChapterHtml();

		// Create the pages of the chapter
		let chapterFinished = false;
		this.currentPosition = 0;
		this.elementsCount = 0;

		// Get the elements count
		this.StartCountBodyChildren(html);

		let head = html.getElementsByTagName("head")[0];
		let body = html.getElementsByTagName("body")[0];

		let newHtml = document.createElement("html");
		let newHead = document.createElement("head");

		newHead.innerHTML = head.innerHTML;
		newHtml.appendChild(newHead);

		while(!chapterFinished){
			let newHtmlPage = newHtml.cloneNode(true) as HTMLHtmlElement;
			let newBody = document.createElement("body");
			newBody.setAttribute("style", "padding: 50px")
			newHtmlPage.appendChild(newBody);

			this.currentElement.innerHTML = newHtmlPage.innerHTML;
			this.readerPosition = 0;

			this.AppendChildren(newBody, body.cloneNode(true), newHtmlPage, true);

			// Add the current html to the chapters array
			this.chapterPages[chapter].push(newHtmlPage);
			chapterFinished = this.currentPosition >= this.elementsCount;
		}
	}
	
	AppendChildren(newElement: Node, currentElement: Node, html: HTMLHtmlElement, root: boolean){
		// Go through all children, beginning at the bottom, and add the children if readerPosition >= startPosition
		//console.log("Reader position: " + this.readerPosition + ", Position: " + this.currentPosition + ", Total count: " + this.elementsCount);

		this.currentElement.innerHTML = html.innerHTML;

		// Return if the element is text without content
		if(currentElement.nodeType === 3 && currentElement.textContent.trim().length == 0) return;

		console.log("AppendChildren")
		console.log(currentElement)

		if(this.currentElement.offsetHeight > this.maxPageHeight) return;

		// Go through the children of the current element
		if(currentElement.childNodes.length > 0){
			// Copy the current element without the children
			let newParent = root ? newElement : currentElement.cloneNode(false) as Element;
			if(!root){
				newElement.appendChild(newParent);

				if(this.readerPosition >= this.currentPosition){
					this.currentPosition++;
				}
				this.readerPosition++;
			}

			for(let i = 0; i < currentElement.childNodes.length; i++){
				this.AppendChildren(newParent, currentElement.childNodes.item(i), html, false);
			}

			// Remove the element if it has no children
			if(newParent.childNodes.length == 0 && !root){
				newParent.parentElement.removeChild(newParent);
			}
		}else{
			// Add the current element as it has no children
			// Run AppendChildren without adding elements until readerPosition is equals to currentPosition
			if(this.readerPosition >= this.currentPosition){
				newElement.appendChild(currentElement.cloneNode(true));
				this.currentPosition++;
			}

			if(!root) this.readerPosition++;
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
				this.CountChildren(currentElement.childNodes.item(i), false);
			}
		}
		if(!root) this.elementsCount++;
   }
   
   //#region Event Handlers
   GoBack(){
      this.router.navigate(["/"])
   }
   //#endregion
}