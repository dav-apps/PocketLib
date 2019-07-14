import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as Dav from 'dav-npm';
import { environment } from 'src/environments/environment';
import { DataService } from 'src/app/services/data-service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	title = 'PocketLib';

   constructor(
      public router: Router,
      public activatedRoute: ActivatedRoute,
      public dataService: DataService
   ){
      // Log the user in if there is a jwt in the url
      this.activatedRoute.queryParams.subscribe(async params => {
         if(params["jwt"]){
            // Login with the jwt
            if(await this.dataService.user.Login(params["jwt"])){
               window.location.href = "/";
            }
         }
      });
   }

	ngOnInit(){
      // Start loading the books
      this.dataService.LoadAllBooks();

		let notificationOptions = {
			icon: "",
			badge: ""
      }

		Dav.Initialize(environment.production ? Dav.DavEnvironment.Production : Dav.DavEnvironment.Development,
							environment.appId,
							[environment.bookFileTableId, environment.bookTableId],
							[],
							notificationOptions,
							{
								UpdateAllOfTable: (tableId: number) => {
									
								},
								UpdateTableObject: (tableObject: Dav.TableObject, fileDownloaded: boolean = false) => {
									if(tableObject.TableId == environment.bookTableId){
										// Reload the book
										this.dataService.ReloadBook(tableObject.Uuid);
									}else if(tableObject.TableId == environment.bookFileTableId && fileDownloaded){
										// Find the book with that file uuid and reload it
										this.dataService.ReloadBookByFile(tableObject.Uuid);
									}
								},
								DeleteTableObject: (tableObject: Dav.TableObject) => {
                           
								},
								SyncFinished: () => {
                           this.dataService.LoadAllBooks();
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
