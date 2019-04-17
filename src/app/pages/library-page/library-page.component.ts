import { Component, Renderer2, ElementRef } from "@angular/core";
import { ReadFile } from 'ngx-file-helpers';
import { EpubBook } from 'src/app/models/EpubBook';
import { Book, GetAllBooks } from 'src/app/models/Book';

@Component({
   selector: "pocketlib-library-page",
   templateUrl: "./library-page.component.html"
})
export class LibraryPageComponent{
	books: Book[] = [];

	constructor(
		private renderer: Renderer2,
		private element: ElementRef
	){}

	async ngOnInit(){
		// Get all book from the database
		this.books = await GetAllBooks();
	}

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
}