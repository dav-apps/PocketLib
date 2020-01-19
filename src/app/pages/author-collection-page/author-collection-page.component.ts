import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IIconStyles } from 'office-ui-fabric-react';
import { DataService, ApiResponse, FindNameWithAppropriateLanguage } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-author-collection-page',
	templateUrl: './author-collection-page.component.html'
})
export class AuthorCollectionPageComponent{
	locale = enUS.authorCollectionPage;
	getStoreBookCollectionSubscriptionKey: number;
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

	backButtonIconStyles: IIconStyles = {
		root: {
         fontSize: 18
		}
	}

	constructor(
		private dataService: DataService,
		private websocketService: WebsocketService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	){
		this.locale = this.dataService.GetLocale().authorCollectionPage;
		this.getStoreBookCollectionSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.GetStoreBookCollection, (response: ApiResponse) => this.GetStoreBookCollectionResponse(response));

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

	GetStoreBookCollectionResponse(response: ApiResponse){
		if(response.status == 200){
			this.collection = response.data;

			// Get the appropriate collection name
			let i = FindNameWithAppropriateLanguage(this.dataService.locale.slice(0, 2), this.collection.names);
			if(i != -1) this.collectionName = this.collection.names[i].name;

			for(let book of this.collection.books){
				// Set the cover
				book.coverContent = '/assets/images/placeholder.png';

				// Cut the description
				if(book.description.length > 170){
					book.description = book.description.slice(0, 169) + "...";
				}
			}
		}else{
			// Redirect back to the author page
			this.router.navigate(["author"]);
		}
	}
}