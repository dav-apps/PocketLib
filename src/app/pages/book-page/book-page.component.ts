import { Component, Renderer2, ElementRef } from "@angular/core";
import { DataService } from 'src/app/services/data-service';
import { EpubBook } from 'src/app/models/EpubBook';

@Component({
	selector: "pocketlib-book-page",
	templateUrl: "./book-page.component.html"
})
export class BookPageComponent{
   constructor(
		private dataService: DataService,
		private renderer: Renderer2,
      private element: ElementRef
	){}

   async ngOnInit(){
		if(this.dataService.currentBook){
			await this.LoadEpubFile(this.dataService.currentBook.file);
		}
	}

	async LoadEpubFile(file: File){
      let book = new EpubBook();
      await book.ReadEpubFile(file);
		
		let htmlTag = await book.chapters[0].GetChapterHtml();
		let htmlElement = this.renderer.createElement("html");
		htmlElement.innerHTML = htmlTag.innerHTML;
		this.renderer.appendChild(this.element.nativeElement, htmlElement);
   }
}