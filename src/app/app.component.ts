import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';
import { Init, DavEnvironment, TableObject, Log } from 'dav-npm';
import { environment } from 'src/environments/environment';
import { DataService } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from './services/websocket-service';
import { GetSettings } from 'src/app/models/Settings';

const visitEventName = "visit";

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent{
	getAuthorOfUserSubscriptionKey: number

   constructor(
		public dataService: DataService,
		public websocketService: WebsocketService,
      public router: Router,
      public activatedRoute: ActivatedRoute
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

		this.getAuthorOfUserSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.GetAuthorOfUser, (response: {status: number, data: any}) => this.GetAuthorOfUserResponse(response));
	}

	async ngOnInit(){
		this.dataService.ApplyTheme();
		this.SetTitleBarColor();
		initializeIcons();

		let notificationOptions = {
			icon: "",
			badge: ""
      }

		Init(
			environment.production ? DavEnvironment.Production : DavEnvironment.Development,
			environment.appId,
			[environment.settingsTableId, environment.bookFileTableId, environment.bookTableId, environment.epubBookmarkTableId, environment.appTableId],
			[],
			true,
			notificationOptions,
			{
				UpdateAllOfTable: async (tableId: number, changed: boolean) => {
					if(tableId == environment.settingsTableId){
						// Reload the settings if it has changed
						if(changed){
							this.dataService.settings = await GetSettings();
						}

						// Resolve the settings synced promise
						this.dataService.settingsSyncPromiseResolve(this.dataService.settings);
					}
				},
				UpdateTableObject: (tableObject: TableObject, fileDownloaded: boolean = false) => {
					if(tableObject.TableId == environment.bookTableId){
						// Reload the book
						this.dataService.ReloadBook(tableObject.Uuid);
					}else if(tableObject.TableId == environment.bookFileTableId && fileDownloaded){
						// Find the book with that file uuid and reload it
						this.dataService.ReloadBookByFile(tableObject.Uuid);
					}
				},
				DeleteTableObject: (tableObject: TableObject) => {
					
				},
				UserDownloadFinished: () => {},
				SyncFinished: () => {
					this.dataService.syncFinished = true;

					// Resolve the settings synced promise
					this.dataService.settingsSyncPromiseResolve(this.dataService.settings);
					
					this.dataService.LoadAllBooks();
				}
			}
		);

		// Get the settings
		this.dataService.settings = await GetSettings();

		// Resolve the settings load promise
		this.dataService.settingsLoadPromiseResolve(this.dataService.settings);

      if(await this.dataService.GetOpenLastReadBook() && this.router.url == "/"){
			this.router.navigate(['loading'], {skipLocationChange: true});
		}
		
		// Load the books
		this.dataService.LoadAllBooks();
		
		// Log the visit
		Log(environment.apiKey, visitEventName);

		// Load the author
		this.websocketService.Emit(WebsocketCallbackType.GetAuthorOfUser, {jwt: await this.dataService.GetSJWT()});
	}
	
	ngOnDestroy(){
		this.websocketService.Unsubscribe(this.getAuthorOfUserSubscriptionKey);
	}

	GetAuthorOfUserResponse(response: {status: number, data: any}){
		if(response.status == 200){
			this.dataService.userAuthor = response.data;
		}else{
			this.dataService.userAuthor = null;
		}
		this.dataService.userAuthorPromiseResolve(this.dataService.userAuthor);
	}
   
   SetTitleBarColor(){
		if(window["Windows"] && window["Windows"].UI.ViewManagement){
			// #007bff
			var themeColor = {
				r: 13,
				g: 71,
				b: 161,
				a: 255
         }

			let titleBar = window["Windows"].UI.ViewManagement.ApplicationView.getForCurrentView().titleBar;
			titleBar.foregroundColor = themeColor;
			titleBar.backgroundColor = themeColor;
			titleBar.buttonBackgroundColor = themeColor;
			titleBar.buttonInactiveBackgroundColor = themeColor;
			titleBar.inactiveForegroundColor = themeColor;
			titleBar.inactiveBackgroundColor = themeColor;
		}
	}
	
	ShowAccountPage(){
		this.router.navigate(["account"])
	}
   
   ShowSettingsPage(){
      this.router.navigate(["settings"])
   }
}
