import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';

@Component({
	selector: 'pocketlib-author-setup-page',
	templateUrl: './author-setup-page.component.html'
})
export class AuthorSetupPageComponent{
	createAuthorSubscriptionKey: number;
	firstName: string = "";
	lastName: string = "";
	bio: string = "";

	constructor(
		public dataService: DataService,
		public websocketService: WebsocketService,
		private router: Router
	){
		this.createAuthorSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.CreateAuthor, (response: {status: number, data: any}) => this.CreateAuthorResponse(response));
	}

	async ngOnInit(){
		// Redirect back to the author page if the user is already an author
		if(await this.dataService.userAuthorPromise){
			this.router.navigate(['/author']);
		}
	}

	ngOnDestroy(){
		this.websocketService.Unsubscribe(this.createAuthorSubscriptionKey);
	}

	async Submit(){
		this.websocketService.Emit(WebsocketCallbackType.CreateAuthor, {
			jwt: await this.dataService.GetSJWT(),
			firstName: this.firstName,
			lastName: this.lastName,
			bio: this.bio
		});

		this.firstName = "";
		this.lastName = "";
		this.bio = "";
	}

	CreateAuthorResponse(response: {status: number, data: any}){
		if(response.status == 201){
			// Set the author in DataService
			this.dataService.userAuthor = response.data;
			this.dataService.userAuthorPromiseResolve(this.dataService.userAuthor);

			// Redirect to the author page
			this.router.navigate(['/author']);
		}else{
			// TODO: Show errors
		}
	}
}