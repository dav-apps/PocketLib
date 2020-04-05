import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';
import { Init, DavEnvironment, TableObject, Log, ApiResponse } from 'dav-npm';
import {
	DataService,
	FindAppropriateLanguage,
	GetBookStatusByString,
	GetStoreBookCoverLink
} from 'src/app/services/data-service';
import { ApiService } from 'src/app/services/api-service';
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
		private apiService: ApiService,
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
		)

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
		await this.LoadAuthorOfUser();
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

	async LoadAuthorOfUser(){
		await this.dataService.userPromise;
		let response: ApiResponse<any> = await this.apiService.GetAuthorOfUser({jwt: this.dataService.user.JWT});

		if(response.status == 200){
			if(response.data.authors){
				this.dataService.adminAuthors = [];

				for(let author of response.data.authors){
					let newAuthor = {
						uuid: author.uuid,
						firstName: author.first_name,
						lastName: author.last_name,
						bios: author.bios,
						collections: [],
						profileImage: author.profile_image
					}

					// Get the collections of the store books
					newAuthor.collections.push(
						...await this.LoadCollections(author.collections)
					)

					this.dataService.adminAuthors.push(newAuthor);
				}
			}else{
				this.dataService.userAuthor = {
					uuid: response.data.uuid,
					firstName: response.data.first_name,
					lastName: response.data.last_name,
					bios: response.data.bios,
					collections: [],
					profileImage: response.data.profile_image
				}

				// Get the collections and store books
				this.dataService.userAuthor.collections.push(
					...await this.LoadCollections(response.data.collections)
				)
			}
		}else{
			this.dataService.userAuthor = null;
			this.dataService.adminAuthors = [];
		}

		this.dataService.userAuthorPromiseResolve(this.dataService.userAuthor);
		this.dataService.adminAuthorsPromiseResolve(this.dataService.adminAuthors);
	}

	async LoadCollections(collectionData: any) : Promise<any[]>{
		let collections: any[] = [];

		for(let collection of collectionData){
			let c = await this.apiService.GetStoreBookCollection({
				jwt: this.dataService.user.JWT,
				uuid: collection.uuid
			})

			if(c.status == 200){
				let collectionResponseData = (c as ApiResponse<any>).data;

				let newCollection = {
					uuid: collectionResponseData.uuid,
					names: collectionResponseData.names,
					categories: [],
					books: []
				}

				// Get the categories with the correct name
				for(let category of collectionResponseData.categories){
					newCollection.categories.push({
						key: category.key,
						name: category.names[FindAppropriateLanguage(this.dataService.locale.slice(0, 2), category.names)].name
					})
				}

				// Get the books
				for(let book of collectionResponseData.books){
					let newBook = {
						uuid: book.uuid,
						title: book.title,
						description: book.description,
						language: book.language,
						status: GetBookStatusByString(book.status),
						cover: book.cover,
						coverContent: book.cover ? GetStoreBookCoverLink(book.uuid) : null,
						file: book.file
					}

					newCollection.books.push(newBook)
				}

				collections.push(newCollection);
			}
		}

		return collections;
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
