import { Component, HostListener } from "@angular/core";
import { Router } from '@angular/router';
import { IButtonStyles, IDialogContentProps } from 'office-ui-fabric-react';
import { ReadFile } from 'ngx-file-helpers';
import { DataService, ApiResponse, FindNameWithAppropriateLanguage } from 'src/app/services/data-service';
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
	updateAuthorOfUserSubscriptionKey: number;
	setProfileImageOfAuthorOfUserKey: number;
   header1Height: number = 600;
	header1TextMarginTop: number = 200;
	profileImageWidth: number = 200;
	createBookDialogVisible: boolean = false;
	createBookDialogTitle: string = "";
	createBookDialogTitleError: string = "";
	editBio: boolean = false;
	newBio: string = "";
	newBioError: string = "";
	collections: {uuid: string, name: string}[] = [];

	dialogPrimaryButtonStyles: IButtonStyles = {
		root: {
			marginLeft: 10
		}
	}
	createBookDialogContentProps: IDialogContentProps = {
		title: this.locale.createBookDialog.title
	}
	bioTextfieldStyles = {
		root: {
			marginTop: "10px"
		}
	}

   constructor(
		public dataService: DataService,
		public websocketService: WebsocketService,
      private router: Router
   ){
		this.locale = this.dataService.GetLocale().authorPage;
		this.createStoreBookSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.CreateStoreBook, (response: ApiResponse) => this.CreateStoreBookResponse(response));
		this.updateAuthorOfUserSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.UpdateAuthorOfUser, (response: ApiResponse) => this.UpdateAuthorOfUserResponse(response));
		this.setProfileImageOfAuthorOfUserKey = this.websocketService.Subscribe(WebsocketCallbackType.SetProfileImageOfAuthorOfUser, (response: ApiResponse) => this.SetProfileImageOfAuthorOfUserResponse(response));
   }
   
   async ngOnInit(){
		this.setSize();
		
		await this.dataService.userAuthorPromise;

		// Get the appropriate language of each collection
		for(let collection of this.dataService.userAuthor.collections){
			let i = FindNameWithAppropriateLanguage(this.dataService.locale.slice(0, 2), collection.names);
			if(i != -1) this.collections.push({uuid: collection.uuid, name: collection.names[i].name});
		}
	}
	
	ngOnDestroy(){
		this.websocketService.Unsubscribe(
			this.createStoreBookSubscriptionKey,
			this.updateAuthorOfUserSubscriptionKey
		)
	}

   @HostListener('window:resize')
	onResize(){
		this.setSize();
   }
   
   setSize(){
		this.header1Height = window.innerHeight - navbarHeight;
		this.header1TextMarginTop = this.header1Height * 0.36;
		
		if(window.innerWidth < 768){
			this.profileImageWidth = 110;
		}else if(window.innerWidth < 1200){
			this.profileImageWidth = 120;
		}else{
			this.profileImageWidth = 130;
		}
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

	ShowCollection(uuid: string){
		this.router.navigate(["author", "collection", uuid]);
	}

	CreateBook(){
		this.createBookDialogTitleError = "";

		this.websocketService.Emit(WebsocketCallbackType.CreateStoreBook, {
			jwt: this.dataService.user.JWT,
			title: this.createBookDialogTitle,
			language: this.dataService.locale.startsWith("de") ? "de" : "en"
		});
	}

	EditBio(){
		if(this.editBio){
			this.newBioError = "";

			// Save the new bio on the server
			this.websocketService.Emit(WebsocketCallbackType.UpdateAuthorOfUser, {
				jwt: this.dataService.user.JWT,
				bio: this.newBio
			});
		}else{
			this.newBio = this.dataService.userAuthor.bio ? this.dataService.userAuthor.bio : "";
			this.newBioError = "";
			this.editBio = true;
		}
	}

	async UploadProfileImage(file: ReadFile){
		// Get the content of the image file
		let reader = new FileReader();

		let readPromise: Promise<string> = new Promise((resolve) => {
			reader.addEventListener('loadend', (e) => {
				resolve(e.srcElement["result"]);
			});
		});

		reader.readAsBinaryString(new Blob([file.underlyingFile]));
		let imageContent = await readPromise;

		// Upload the image
		this.websocketService.Emit(WebsocketCallbackType.SetProfileImageOfAuthorOfUser, {
			jwt: this.dataService.user.JWT,
			uuid: this.dataService.userAuthor.uuid,
			type: file.type,
			file: imageContent
		});
	}

	CreateStoreBookResponse(response: ApiResponse){
		if(response.status == 201){
			// Add the new book to the books in DataService
			//this.dataService.userAuthor.books.push({uuid: response.data.uuid, title: response.data.title});
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

	UpdateAuthorOfUserResponse(response: ApiResponse){
		if(response.status == 200){
			this.dataService.userAuthor.bio = response.data.bio;
			this.editBio = false;
		}else{
			let errorCode = response.data.errors[0].code;

			switch(errorCode){
				case 2303:
					// Field too short: bio
					this.newBioError = this.locale.errors.bioTooShort;
					break;
				case 2403:
					// Field too long: bio
					this.newBioError = this.locale.errors.bioTooLong;
					break;
				default:
					// Unexpected error
					this.newBioError = this.locale.errors.unexpectedError;
					break;
			}
		}
	}

	SetProfileImageOfAuthorOfUserResponse(response: ApiResponse){
		console.log(response);
	}
}