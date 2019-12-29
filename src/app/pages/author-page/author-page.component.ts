import { Component, HostListener } from "@angular/core";
import { Router } from '@angular/router';
import { IButtonStyles, IDialogContentProps } from 'office-ui-fabric-react';
import { DataService, ApiResponse } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
import { enUS } from 'src/locales/locales';

const navbarHeight: number = 64;

@Component({
	selector: "pocketlib-author-page",
   templateUrl: "./author-page.component.html",
   styleUrls: [
      './author-page.component.scss'
   ]
})
export class AuthorPageComponent{
	locale = enUS.authorPage;
	createStoreBookSubscriptionKey: number;
   header1Height: number = 600;
	header1TextMarginTop: number = 200;
	createBookDialogVisible: boolean = false;
	createBookDialogTitle: string = "";
	createBookDialogTitleError: string = "";

	dialogPrimaryButtonStyles: IButtonStyles = {
		root: {
			marginLeft: 10
		}
	}
	createBookDialogContentProps: IDialogContentProps = {
		title: this.locale.createBookDialog.title
	}

   constructor(
		public dataService: DataService,
		public websocketService: WebsocketService,
      private router: Router
   ){
		this.locale = this.dataService.GetLocale().authorPage;
		this.createStoreBookSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.CreateStoreBook, (response: ApiResponse) => this.CreateStoreBookResponse(response));
   }
   
   ngOnInit(){
      this.setSize();
	}
	
	ngOnDestroy(){
		this.websocketService.Unsubscribe(this.createStoreBookSubscriptionKey);
	}

   @HostListener('window:resize')
	onResize(){
		this.setSize();
   }
   
   setSize(){
		this.header1Height = window.innerHeight - navbarHeight;
		this.header1TextMarginTop = this.header1Height * 0.36;
   }

   createProfileButtonClick(){
		if(this.dataService.user.IsLoggedIn){
			// Redirect to the Author setup page
			this.router.navigate(['/author/setup']);
      }else{
			// Redirect to the Account page
			this.router.navigate(["/account"]);
		}
	}
	
	ShowBook(uuid: string){
		this.router.navigate(["author", "book", uuid]);
	}

	ShowCreateBookDialog(){
		this.createBookDialogTitle = "";
		this.createBookDialogTitleError = "";

		this.createBookDialogContentProps.title = this.locale.createBookDialog.title;
		this.createBookDialogVisible = true;
	}

	CreateBook(){
		this.createBookDialogTitleError = "";

		this.websocketService.Emit(WebsocketCallbackType.CreateStoreBook, {
			jwt: this.dataService.user.JWT,
			title: this.createBookDialogTitle,
			language: this.dataService.locale.startsWith("de") ? "de" : "en"
		});
	}

	CreateStoreBookResponse(response: ApiResponse){
		if(response.status == 201){
			// Add the new book to the books in DataService
			this.dataService.userAuthor.books.push({uuid: response.data.uuid, title: response.data.title});
			this.createBookDialogVisible = false;

			// Redirect to AuthorAppPage
			this.router.navigate(["author", "book", response.data.uuid]);
		}else{
			let errors = response.data.errors;

			for(let error of errors){
				switch(error.code){
					case 2105:
						// Title missing
						this.createBookDialogTitleError = this.locale.createBookDialog.errors.titleMissing;
					case 2304:
						// Title too short
						this.createBookDialogTitleError = this.locale.createBookDialog.errors.titleTooShort;
						break;
					case 2404:
						// Title too long
						this.createBookDialogTitleError = this.locale.createBookDialog.errors.titleTooLong;
						break;
					default:
						// Unexpected error
						this.createBookDialogTitleError = this.locale.createBookDialog.errors.unexpectedError;
						break;
				}
			}
		}
	}
}