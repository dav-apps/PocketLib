import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Book } from 'src/app/models/Book';
import { enUS } from 'src/locales/locales';
import { DataService } from 'src/app/services/data-service';

@Component({
	selector: 'pocketlib-delete-book-modal',
	templateUrl: './delete-book-modal.component.html'
})
export class DeleteBookModalComponent{
   locale = enUS.deleteBookModal;
	@Output() delete = new EventEmitter();
	@Input() book: Book;
	@ViewChild('deleteBookModal', {static: true}) deleteBookModal: ElementRef;

	constructor(
      private dataService: DataService,
		private modalService: NgbModal
	){
      this.locale = this.dataService.GetLocale().deleteBookModal;
   }

	Show(book?: Book){
		if(book){
			this.book = book;
		}

		this.modalService.open(this.deleteBookModal).result.then(() => {
			this.delete.emit();
		}, () => {});
	}
}