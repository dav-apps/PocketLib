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
			await this.LoadCurrentPage();
		}
	}
	
	async LoadCurrentPage(){
		let htmlTag = await this.book.chapters[this.dataService.currentChapter].GetChapterHtml();
		this.currentElement.innerHTML = htmlTag.innerHTML;
	}
	
	PrevPage(){
		if(this.dataService.currentChapter > 0){
			this.dataService.currentChapter--;
			this.LoadCurrentPage();
		}
	}

	NextPage(){
		if(this.book.chapters.length > this.dataService.currentChapter + 1){
			this.dataService.currentChapter++;
			this.LoadCurrentPage();
		}
	}
}