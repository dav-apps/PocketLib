import { Component, Input, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { enUS } from 'src/locales/locales';
import { DataService } from 'src/app/services/data-service';
import { PdfBook } from 'src/app/models/PdfBook';
declare var $: any;

@Component({
   selector: 'pocketlib-rename-book-modal',
   templateUrl: './rename-book-modal.component.html'
})
export class RenameBookModalComponent{
   locale = enUS.renameBookModal;
   @Input() book: PdfBook;
   @Output() save = new EventEmitter();
   @ViewChild('renameBookModal', {static: true}) renameBookModal: ElementRef;
   minTitleLength: number = 3;
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

		this.modalService.open(this.renameBookModal).result.then(() => this.Save(), () => {});
		setTimeout(() => $(".ms-TextField-field, .field-65").focus(), 1);
   }

   Save(){
      if(this.title.length < this.minTitleLength) return;
		this.save.emit(this.title);
		this.modalService.dismissAll();
   }
}