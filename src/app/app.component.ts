import { Component } from '@angular/core';
import * as Dav from 'dav-npm';
import { environment } from 'src/environments/environment.prod';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	title = 'PocketLib';

	ngOnInit(){
		let notificationOptions = {
			icon: "",
			badge: ""
		}

		Dav.Initialize(environment.production ? Dav.DavEnvironment.Production : Dav.DavEnvironment.Development,
							environment.appId,
							[],
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
}
