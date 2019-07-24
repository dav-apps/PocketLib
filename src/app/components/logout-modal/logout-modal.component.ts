import { Component, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { enUS } from 'src/locales/locales';
import { DataService } from 'src/app/services/data-service';

@Component({
   selector: "pocketlib-logout-modal",
   templateUrl: "./logout-modal.component.html"
})
export class LogoutModalComponent{
	locale = enUS.logoutModal;
	@Output() logout = new EventEmitter();
	@ViewChild('logoutModal', { static: true }) logoutModal: ElementRef;

   constructor(
		private dataService: DataService,
      private modalService: NgbModal
   ){
		this.locale = this.dataService.GetLocale().logoutModal;
	}
	
	Show(){
		this.modalService.open(this.logoutModal).result.then(() => {
			this.logout.emit();
		}, () => {});
	}
}