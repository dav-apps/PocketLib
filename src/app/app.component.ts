import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as Dav from 'dav-npm';
import { environment } from 'src/environments/environment';
import { DataService } from 'src/app/services/data-service';
import { Book, GetAllBooks } from 'src/app/models/Book';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	title = 'PocketLib';

   constructor(
      private router: Router,
      private dataService: DataService
   ){}

	ngOnInit(){
      // Start loading the books
      GetAllBooks().then((books: Book[]) => {
         this.dataService.books = books;
      });

		let notificationOptions = {
			icon: "",
			badge: ""
      }

		Dav.Initialize(environment.production ? Dav.DavEnvironment.Production : Dav.DavEnvironment.Development,
							environment.appId,
							[environment.bookTableId, environment.bookFileTableId],
							[],
							notificationOptions,
							{
								UpdateAllOfTable: (tableId: number) => {

								},
								UpdateTableObject: (tableObject: Dav.TableObject) => {

								},
								DeleteTableObject: (tableObject: Dav.TableObject) => {

								},
								SyncFinished: () => {

								}
							});
	}
	
	ShowAccountPage(){
		this.router.navigate(["account"])
	}
   
   ShowSettingsPage(){
      this.router.navigate(["settings"])
   }
}
