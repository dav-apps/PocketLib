import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DataService, DownloadProfileImageOfAuthorAsBase64 } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-horizontal-author-list',
	templateUrl: './horizontal-author-list.component.html'
})
export class HorizontalAuthorListComponent{
	locale = enUS.horizontalAuthorList;
	authors: {
		uuid: string,
		firstName: string,
		lastName: string,
		profileImage: boolean,
		profileImageContent: string
	}[] = [];
	hoveredAuthorIndex: number = -1;
	
	constructor(
		public dataService: DataService,
		private websocketService: WebsocketService,
		private router: Router
	){
		this.locale = this.dataService.GetLocale().horizontalAuthorList;
	}

	async ngOnInit(){
		// Get the latest authors
		this.authors = [];
		let response = await this.websocketService.Emit(WebsocketCallbackType.GetLatestAuthors, {});
		if(response.status != 200) return;

		for(let author of response.data.authors){
			this.authors.push({
				uuid: author.uuid,
				firstName: author.first_name,
				lastName: author.last_name,
				profileImage: author.profile_image,
				profileImageContent: null
			});
		}

		// Download the profile images
		for(let author of this.authors){
			if(!author.profileImage) continue;
			author.profileImageContent = await DownloadProfileImageOfAuthorAsBase64(author.uuid, this.dataService.user.JWT);
		}
	}

	NavigateToAuthor(uuid: string){
		this.router.navigate(["store", "author", uuid]);
	}
}