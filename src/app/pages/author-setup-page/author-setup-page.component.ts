import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';

@Component({
	selector: 'pocketlib-author-setup-page',
	templateUrl: './author-setup-page.component.html'
})
export class AuthorSetupPageComponent{
	setAuthorOfUserSubscriptionKey: number;
	firstName: string = "";
	lastName: string = "";
	bio: string = "";

	constructor(
		public dataService: DataService,
		public websocketService: WebsocketService,
		private router: Router
	){
		this.setAuthorOfUserSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.SetAuthorOfUser, (response: {status: number, data: any}) => this.SetAuthorOfUserResponse(response));
	}

	async ngOnInit(){
		// Redirect back to the author page if the user is already an author
		if(await this.dataService.userAuthorPromise){
			this.router.navigate(['/author']);
		}
	}

	ngOnDestroy(){
		this.websocketService.Unsubscribe(this.setAuthorOfUserSubscriptionKey);
	}

	async Submit(){
		this.websocketService.Emit(WebsocketCallbackType.SetAuthorOfUser, {
			jwt: this.dataService.user.JWT,
			firstName: this.firstName,
			lastName: this.lastName,
			bio: this.bio
		});

		this.firstName = "";
		this.lastName = "";
		this.bio = "";
	}

	SetAuthorOfUserResponse(response: {status: number, data: any}){
		if(response.status == 200){
			// Set the author in DataService
			this.dataService.userAuthor.firstName = response.data.first_name;
			this.dataService.userAuthor.lastName = response.data.last_name;
			this.dataService.userAuthor.bio = response.data.bio;
			this.dataService.userAuthorPromiseResolve(this.dataService.userAuthor);

			// Redirect to the author page
			this.router.navigate(['/author']);
		}else{
			// TODO: Show errors
		}
	}
}