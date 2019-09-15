import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { enUS } from 'src/locales/locales';
import { DataService } from 'src/app/services/data-service';
import { Book } from 'src/app/models/Book';
import { EpubBook } from 'src/app/models/EpubBook';

@Component({
	selector: 'pocketlib-delete-book-modal',
	templateUrl: './delete-book-modal.component.html'
})
export class DeleteBookModalComponent{
   locale = enUS.deleteBookModal;
   @Input() book: Book;
   @Output() delete = new EventEmitter();
   @ViewChild('deleteBookModal', {static: true}) deleteBookModal: ElementRef;
   showAuthor: boolean = false;

	constructor(
      private dataService: DataService,
		private modalService: NgbModal
	){
      this.locale = this.dataService.GetLocale().deleteBookModal;
   }

	Show(book?: Book){
      if(book) this.book = book;
      this.showAuthor = this.book instanceof EpubBook;

		this.modalService.open(this.deleteBookModal).result.then(() => {
			this.delete.emit();
		}, () => {});
	}
}