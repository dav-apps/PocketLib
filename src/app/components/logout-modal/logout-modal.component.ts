import { Component, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
   selector: "pocketlib-logout-modal",
   templateUrl: "./logout-modal.component.html"
})
export class LogoutModalComponent{
	@Output() logout = new EventEmitter();
	@ViewChild('logoutModal') logoutModal: ElementRef;

   constructor(
      private modalService: NgbModal
   ){}
	
	Show(){
		this.modalService.open(this.logoutModal).result.then(() => {
			this.logout.emit();
		}, () => {});
	}
}