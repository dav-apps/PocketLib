import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';
import { Init, DavEnvironment, TableObject, Log } from 'dav-npm';
import { environment } from 'src/environments/environment';
import { DataService } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from './services/websocket-service';
import { RoutingService } from './services/routing-service';
import { GetSettings } from 'src/app/models/Settings';

const visitEventName = "visit";

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent{
   constructor(
		public dataService: DataService,
		private websocketService: WebsocketService,
		public routingService: RoutingService,
      private router: Router
   ){}

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
		await this.dataService.userPromise;
		this.GetAuthorOfUserResponse(
			await this.websocketService.Emit(WebsocketCallbackType.GetAuthorOfUser, {jwt: this.dataService.user.JWT})
		)
	}

	ngAfterViewInit(){
		this.setSize();
	}

	@HostListener('window:resize')
	onResize(){
		this.setSize();
	}

	setSize(){
		let navbarHeight = document.getElementById('navbar').clientHeight;
		this.dataService.contentHeight = window.innerHeight - navbarHeight;
	}

	GetAuthorOfUserResponse(response: {status: number, data: any}){
		if(response.status == 200){
			if(response.data.authors){
				this.dataService.adminAuthors = [];

				for(let author of response.data.authors){
					this.dataService.adminAuthors.push({
						uuid: author.uuid,
						firstName: author.first_name,
						lastName: author.last_name,
						bios: author.bios,
						collections: author.collections,
						profileImage: author.profile_image
					});
				}
			}else{
				this.dataService.userAuthor = {
					uuid: response.data.uuid,
					firstName: response.data.first_name,
					lastName: response.data.last_name,
					bios: response.data.bios,
					collections: response.data.collections,
					profileImage: response.data.profile_image
				}
			}
		}else{
			this.dataService.userAuthor = null;
			this.dataService.adminAuthors = [];
		}

		this.dataService.userAuthorPromiseResolve(this.dataService.userAuthor);
		this.dataService.adminAuthorsPromiseResolve(this.dataService.adminAuthors);
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

	ShowAuthorPage(){
		this.router.navigate(["author"])
	}

	ShowStorePage(){
		this.router.navigate(["store"])
	}
	
	ShowAccountPage(){
		this.router.navigate(["account"])
	}
   
   ShowSettingsPage(){
      this.router.navigate(["settings"])
   }
}
