import { Component, Input, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { enUS } from 'src/locales/locales';
import { DataService } from 'src/app/services/data-service';
import { PdfBook } from 'src/app/models/PdfBook';

@Component({
   selector: 'pocketlib-rename-book-modal',
   templateUrl: './rename-book-modal.component.html'
})
export class RenameBookModalComponent{
   locale = enUS.renameBookModal;
   @Input() book: PdfBook;
   @Output() save = new EventEmitter();
	@ViewChild('renameBookModal', {static: true}) renameBookModal: ElementRef;
	title: string = "";

   constructor(
      private dataService: DataService,
      private modalService: NgbModal
   ){
      this.locale = this.dataService.GetLocale().renameBookModal;
   }

   Show(book?: PdfBook){
		if(book) this.book = book;
		this.title = book.title;

      this.modalService.open(this.renameBookModal).result.then(() => {
         this.save.emit(this.title);
      }, () => {});
   }
}