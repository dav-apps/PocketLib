import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IIconStyles, IDialogContentProps } from 'office-ui-fabric-react';
import { DataService, ApiResponse, FindNameWithAppropriateLanguage, GetContentAsInlineSource } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-author-collection-page',
	templateUrl: './author-collection-page.component.html'
})
export class AuthorCollectionPageComponent{
	locale = enUS.authorCollectionPage;
	getStoreBookCollectionSubscriptionKey: number;
	getStoreBookCoverSubscriptionKey: number;
	uuid: string;
	collectionName: string = "";
	collection: {
		uuid: string,
		names: {name: string, language: string}[],
		books: {
			uuid: string,
			title: string,
			description: string,
			language: string,
			status: string,
			cover: boolean,
			file: boolean,
			coverContent: string
		}[]
	} = {uuid: "", names: [], books: []};
	currentCoverDownload: string = "";
	coverDownloadPromiseResolve: Function;
	collectionNamesDialogVisible: boolean = false;
	collectionNames: {name: string, language: string, fullLanguage: string, edit: boolean}[] = [];

	backButtonIconStyles: IIconStyles = {
		root: {
         fontSize: 18
		}
	}
	collectionNamesDialogContentProps: IDialogContentProps = {
		title: this.locale.collectionNamesDialog.title
	}

	constructor(
		private dataService: DataService,
		private websocketService: WebsocketService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	){
		this.locale = this.dataService.GetLocale().authorCollectionPage;
		this.getStoreBookCollectionSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.GetStoreBookCollection, (response: ApiResponse) => this.GetStoreBookCollectionResponse(response));
		this.getStoreBookCoverSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.GetStoreBookCover, (response: ApiResponse) => this.GetStoreBookCoverResponse(response));

		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid');
	}

	async ngOnInit(){
		// Wait for the user to be loaded
		await this.dataService.userPromise;

		// Redirect back to the author page if the user is not an author
		if(!this.dataService.userAuthor && !(await this.dataService.userAuthorPromise)){
			this.router.navigate(['author']);
		}

		// Get the collection
		this.websocketService.Emit(WebsocketCallbackType.GetStoreBookCollection, {
			jwt: this.dataService.user.JWT,
			uuid: this.uuid
		});
	}

	ngOnDestroy(){
		this.websocketService.Unsubscribe(this.getStoreBookCollectionSubscriptionKey);
	}

	GoBack(){
		this.router.navigate(["author"]);
	}

	ShowBook(uuid: string){
		this.router.navigate(["author", "book", uuid]);
	}

	ShowCollectionNamesDialog(){
		// Set the collection names
		this.collectionNames = [];
		for(let collectionName of this.collection.names){
			this.collectionNames.push({
				name: collectionName.name, 
				language: collectionName.language, 
				fullLanguage: collectionName.language == "de" ? this.locale.languages.de : this.locale.languages.en,
				edit: false
			});
		}

		this.collectionNamesDialogContentProps.title = this.locale.collectionNamesDialog.title;
		this.collectionNamesDialogVisible = true;

		// Show the text fields for the different languages on the dialog
		setTimeout(() => {
			let namesContainer = document.getElementById('names-text-fields-container');
			let namesTemplate = document.getElementById('names-text-fields-template');

			console.log(namesTemplate.children)
			for(let i = 0; i < namesTemplate.children.length; i++){
				let child = namesTemplate.children.item(i);
				namesContainer.append(child);
			}
		}, 100);
	}

	async GetStoreBookCollectionResponse(response: ApiResponse){
		if(response.status == 200){
			this.collection = response.data;

			// Get the appropriate collection name
			let i = FindNameWithAppropriateLanguage(this.dataService.locale.slice(0, 2), this.collection.names);
			if(i != -1) this.collectionName = this.collection.names[i].name;
			let coverDownloads: string[] = [];

			for(let book of this.collection.books){
				// Set the default cover
				book.coverContent = '/assets/images/placeholder.png';

				if(book.cover){
					// Add the cover to the downloads
					coverDownloads.push(book.uuid);
				}

				// Cut the description
				if(book.description.length > 170){
					book.description = book.description.slice(0, 169) + "...";
				}
			}

			// Download the covers
			for(let uuid of coverDownloads){
				let coverDownloadPromise: Promise<ApiResponse> = new Promise((resolve) => {
					this.coverDownloadPromiseResolve = resolve;
				});

				// Start the cover download
				this.websocketService.Emit(WebsocketCallbackType.GetStoreBookCover, {jwt: this.dataService.user.JWT, uuid});

				// Wait for the download to finish
				let coverResponse = await coverDownloadPromise;
				
				if(coverResponse.status == 200){
					// Find the book with the uuid
					let i = this.collection.books.findIndex(book => book.uuid == uuid);
					if(i != -1){
						this.collection.books[i].coverContent = GetContentAsInlineSource(coverResponse.data, coverResponse.headers['content-type']);
					}
				}
			}
		}else{
			// Redirect back to the author page
			this.router.navigate(["author"]);
		}
	}

	GetStoreBookCoverResponse(response: ApiResponse){
		this.coverDownloadPromiseResolve(response);
	}
}