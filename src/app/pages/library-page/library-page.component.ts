import { Component } from "@angular/core";
import { Router } from '@angular/router';
import { ReadFile } from 'ngx-file-helpers';
import { Book } from 'src/app/models/Book';
import { DataService } from 'src/app/services/data-service';

@Component({
   selector: "pocketlib-library-page",
   templateUrl: "./library-page.component.html"
})
export class LibraryPageComponent{
	constructor(
		private router: Router,
		private dataService: DataService
   ){
      this.dataService.navbarVisible = true;
   }

	async filePick(file: ReadFile){
		// Create a new book
		await Book.Create(file.underlyingFile);
	}
   
   ShowBook(book: Book){
		this.dataService.currentBook = book;
		this.router.navigate(["/book"]);
   }
}