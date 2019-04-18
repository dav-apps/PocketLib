import { Component, Renderer2, ElementRef } from "@angular/core";
import { Router } from '@angular/router';
import { ReadFile } from 'ngx-file-helpers';
import { EpubBook } from 'src/app/models/EpubBook';
import { Book, GetAllBooks } from 'src/app/models/Book';
import { DataService } from 'src/app/services/data-service';

@Component({
   selector: "pocketlib-library-page",
   templateUrl: "./library-page.component.html"
})
export class LibraryPageComponent{
	constructor(
		private renderer: Renderer2,
      private element: ElementRef,
		private router: Router,
		private dataService: DataService
	){}

	async filePick(file: ReadFile){
		//await this.LoadEpubFile(file.underlyingFile);
		
		// Create a new book
		await Book.Create(file.underlyingFile);
	}
	
	async LoadEpubFile(file: File){
      let book = new EpubBook();
      await book.ReadEpubFile(file);
		
		let htmlTag = await book.chapters[8].GetChapterHtml();
		let htmlElement = this.renderer.createElement("html");
		htmlElement.innerHTML = htmlTag.innerHTML;
		this.renderer.appendChild(this.element.nativeElement, htmlElement);
   }
   
   ShowBook(book: Book){
      this.router.navigate(["/book"]);
   }
}