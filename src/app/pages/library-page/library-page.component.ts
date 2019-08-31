import { Component, ViewChild, ElementRef } from "@angular/core";
import { Router } from '@angular/router';
import { ReadFile } from 'ngx-file-helpers';
import { Book } from 'src/app/models/Book';
import { DataService } from 'src/app/services/data-service';
import { transition, trigger, state, style, animate } from '@angular/animations';
import { DeleteBookModalComponent } from 'src/app/components/delete-book-modal/delete-book-modal.component';
import { enUS } from 'src/locales/locales';

@Component({
   selector: "pocketlib-library-page",
	templateUrl: "./library-page.component.html",
	animations: [
		trigger('addBookHover', [
			state('false', style({
				transform: 'rotateZ(0deg)',
				fontSize: '22px'
			})),
			state('true', style({
				transform: 'rotateZ(90deg)',
				fontSize: '28px'
			})),
			transition('true => false', [
				animate('0.18s ease-in')
			]),
			transition('false => true', [
				animate('0.18s ease-out')
			])
		])
	]
})
export class LibraryPageComponent{
	locale = enUS.libraryPage;
   @ViewChild('contextMenu', {static: true}) contextMenu: ElementRef;
   @ViewChild(DeleteBookModalComponent, {static: true}) deleteBookModalComponent: DeleteBookModalComponent;
	contextMenuVisible: boolean = false;
	contextMenuPositionX: number = 0;
	contextMenuPositionY: number = 0;
	selectedBook: Book;
   hoveredBookIndex: number = -1;	// The currently hovered book, for showing the shadow
   addBookHover: boolean = false;	// Indicator for if the mouse is over the add book card

	constructor(
		public router: Router,
		public dataService: DataService
   ){
		this.locale = this.dataService.GetLocale().libraryPage;
		this.dataService.navbarVisible = true;
		document.onclick = (event: MouseEvent) => {
			if(!this.contextMenuVisible) return;

			let target = event.target as Node;
			let contextMenu = this.contextMenu.nativeElement as HTMLDivElement;

			if(!contextMenu.contains(target)){
				// Hide the context menu
				this.contextMenuVisible = false;
			}
		}
   }

	async filePick(file: ReadFile){
		// Create a new book
      await Book.Create(file.underlyingFile, file.name.slice(0, file.name.lastIndexOf('.')));
      await this.dataService.LoadAllBooks();
	}
   
   ShowBook(book: Book){
		this.dataService.currentBook = book;
		this.router.navigate(["book"]);
   }

   onContextMenu(event: MouseEvent, book: Book){
		this.selectedBook = book;
		
		// Set the position of the context menu
		this.contextMenuPositionX = event.clientX;
		this.contextMenuPositionY = event.clientY;

		if(this.contextMenuVisible){
			this.contextMenuVisible = false;
			setTimeout(() => {
				this.contextMenuVisible = true;
			}, 60);
		}else{
			this.contextMenuVisible = true;
		}
		return false;
   }
	
	ShowDeleteBookModal(){
		this.contextMenuVisible = false;
		this.deleteBookModalComponent.Show(this.selectedBook);
	}

	async DeleteBook(){
		await this.selectedBook.Delete();
		await this.dataService.LoadAllBooks();
	}
}