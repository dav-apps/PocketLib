import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Book } from 'src/app/models/Book';

@Component({
	selector: 'pocketlib-delete-book-modal',
	templateUrl: './delete-book-modal.component.html'
})
export class DeleteBookModalComponent{
	@Output() delete = new EventEmitter();
	@Input() book: Book;
	@ViewChild('deleteBookModal', {static: true}) deleteBookModal: ElementRef;

	constructor(
		private modalService: NgbModal
	){}

	Show(book?: Book){
		if(book){
			this.book = book;
		}

		this.modalService.open(this.deleteBookModal).result.then(() => {
			this.delete.emit();
		}, () => {});
	}
}