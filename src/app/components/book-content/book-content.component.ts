import { Component, Renderer2, ElementRef } from '@angular/core';
import { DataService } from 'src/app/services/data-service';
import { EpubBook } from 'src/app/models/EpubBook';

@Component({
   selector: 'pocketlib-book-content',
   templateUrl: './book-content.component.html'
})
export class BookContentComponent{
	book = new EpubBook();
	currentElement: HTMLElement;

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
         //await this.LoadCurrentPage();

         //this.book.GeneratePages();
         this.LoadPage();
		}
	}
	
	async LoadCurrentPage(){
		let htmlTag = await this.book.chapters[this.dataService.currentChapter].GetChapterHtml();
		this.currentElement.innerHTML = htmlTag.innerHTML;
	}
	
	PrevPage(){
		if(this.dataService.currentChapter > 0){
			this.dataService.currentChapter--;
			//this.LoadCurrentPage();
			this.LoadPage();
		}
	}

	NextPage(){
		if(this.book.chapters.length > this.dataService.currentChapter + 1){
			this.dataService.currentChapter++;
			//this.LoadCurrentPage();
			this.LoadPage();
		}
   }
   
   async LoadPage(){
		let doc = await this.book.chapters[this.dataService.currentChapter].GetChapterHtml();

      let head = doc.getElementsByTagName("head")[0];
      let body = doc.getElementsByTagName("body")[0];

		let newHtml = document.createElement("html");
		
      let newHead = document.createElement("head");
		newHead.innerHTML = head.innerHTML;
		newHtml.appendChild(newHead);
		
		let newBody = document.createElement("body");
		newHtml.appendChild(newBody);

		this.currentElement.innerHTML = newHtml.outerHTML;
		this.AppendChildren(newBody, body.children.item(0), newHtml);
	}

	AppendChildren(newElement: Node, currentElement: Node, html: HTMLHtmlElement){
		this.currentElement.innerHTML = html.innerHTML;
		console.log(this.currentElement.offsetHeight);
		if(this.currentElement.offsetHeight > 500) return;

		// Go through the children of the current element
		if(currentElement.childNodes.length > 0){
			// Copy the current element without the children
         let e = currentElement.cloneNode(false) as Element;
         newElement.appendChild(e);

			for(let i = 0; i < currentElement.childNodes.length; i++){
				this.AppendChildren(e, currentElement.childNodes.item(i), html);
			}
		}else{
			// Add the current element as it has no children
         newElement.appendChild(currentElement.cloneNode(true));
		}
	}
}