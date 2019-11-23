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
	getAuthorOfUserSubscriptionKey: number;
	firstName: string = "";
	lastName: string = "";
	bio: string = "";

	constructor(
		public dataService: DataService,
		public websocketService: WebsocketService,
		private router: Router
	){
		this.createAuthorSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.CreateAuthor, (response: any) => this.CreateAuthorResponse(response));
		this.getAuthorOfUserSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.GetAuthorOfUser, (response: any) => this.GetAuthorOfUserResponse(response));
	}

	async ngOnInit(){
		this.websocketService.Emit(WebsocketCallbackType.GetAuthorOfUser, {jwt: await this.dataService.GetSJWT()});
	}

	ngOnDestroy(){
		this.websocketService.Unsubscribe(
			this.createAuthorSubscriptionKey,
			this.getAuthorOfUserSubscriptionKey
		)
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

	CreateAuthorResponse(response: any){
		if(response.status == 201){
			// Redirect to the author page
			this.router.navigate(['/author'])
		}else{
			// TODO: Show errors
		}
	}

	GetAuthorOfUserResponse(response: any){
		if(response.status == 200){
			this.router.navigate(['/author'])
		}
	}
}