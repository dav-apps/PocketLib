import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';
import { Init, DavEnvironment, TableObject, Log } from 'dav-npm';
import { DataService } from 'src/app/services/data-service';
import { RoutingService } from './services/routing-service';
import { GetSettings } from 'src/app/models/Settings';
import { environment } from 'src/environments/environment';

const visitEventName = "visit";

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent{
   constructor(
		public dataService: DataService,
		public routingService: RoutingService,
      private router: Router
   ){}

	async ngOnInit(){
		this.dataService.ApplyTheme();
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
			notificationOptions,
			{
				UpdateAllOfTable: async (tableId: number, changed: boolean) => {
					if(tableId == environment.settingsTableId){
						// Reload the settings if it has changed
						if(changed){
							this.dataService.settings = await GetSettings();
						}

						// Resolve the settings synced promise
						this.dataService.settingsSyncPromiseHolder.Resolve(this.dataService.settings);
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
					this.dataService.settingsSyncPromiseHolder.Resolve(this.dataService.settings);
					
					this.dataService.LoadAllBooks();
				}
			}
		)

		// Get the settings
		this.dataService.settings = await GetSettings();

		// Resolve the settings load promise
		this.dataService.settingsLoadPromiseHolder.Resolve(this.dataService.settings);

      if(await this.dataService.GetOpenLastReadBook() && this.router.url == "/"){
			this.router.navigate(['loading'], {skipLocationChange: true});
		}
		
		// Load the books
		this.dataService.LoadAllBooks();
		
		// Log the visit
		Log(environment.apiKey, visitEventName);

		// Load the author
		await this.dataService.LoadAuthorOfUser();

		// Load the categories
		await this.dataService.LoadCategories();
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

	ShowLibraryPage() {
		this.routingService.NavigateToLibraryPage();
		return false;
	}

	ShowAuthorPage(){
		this.routingService.NavigateToAuthorPage();
	}

	ShowStorePage(){
		this.routingService.NavigateToStorePage();
	}
	
	ShowAccountPage(){
		this.routingService.NavigateToAccountPage();
	}
   
   ShowSettingsPage(){
		this.routingService.NavigateToSettingsPage();
   }
}
