import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as Dav from 'dav-npm';
import { environment } from 'src/environments/environment';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	title = 'PocketLib';

	constructor(private router: Router){}

	ngOnInit(){
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
