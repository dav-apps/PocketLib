import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IIconStyles } from 'office-ui-fabric-react';
import { DataService, ApiResponse } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';

@Component({
	selector: 'pocketlib-author-book-page',
	templateUrl: './author-book-page.component.html'
})
export class AuthorBookPageComponent{
	getStoreBookSubscriptionKey: number;
	uuid: string;
	book: {title: string, description: string} = {title: "", description: ""}
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
		this.getStoreBookSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.GetStoreBook, (response: ApiResponse) => this.GetStoreBookResponse(response));
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid');
	}

	async ngOnInit(){
		// Wait for the user to be loaded
		await this.dataService.userPromise;

		// Redirect back to the author page if the user is not an author
		if((await this.dataService.userAuthorPromise) == null){
			this.router.navigate(['author']);
		}

		this.websocketService.Emit(WebsocketCallbackType.GetStoreBook, {
			jwt: this.dataService.user.JWT,
			uuid: this.uuid
		});
	}

	ngOnDestroy(){
		this.websocketService.Unsubscribe(this.getStoreBookSubscriptionKey);
	}

	GoBack(){
		this.router.navigate(["author"]);
	}

	GetStoreBookResponse(response: ApiResponse){
		if(response.status == 200){
			this.book.title = response.data.title;
			this.book.description = response.data.description;
		}else{
			// Redirect back to the author page
			this.router.navigate(['author']);
		}
	}
}