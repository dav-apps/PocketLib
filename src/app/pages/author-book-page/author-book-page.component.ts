import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IIconStyles, IButtonStyles, IDialogContentProps } from 'office-ui-fabric-react';
import { ReadFile } from 'ngx-file-helpers';
import { DataService, ApiResponse, GetContentAsInlineSource } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-author-book-page',
	templateUrl: './author-book-page.component.html'
})
export class AuthorBookPageComponent{
	locale = enUS.authorBookPage;
	getStoreBookSubscriptionKey: number;
	updateStoreBookSubscriptionKey: number;
	getStoreBookCoverSubscriptionKey: number;
	setStoreBookCoverSubscriptionKey: number;
	setStoreBookFileSubscriptionKey: number;
	uuid: string;
	book: {collection: string, title: string, description: string} = {collection: "", title: "", description: ""}
	editTitleDialogVisible: boolean = false;
	editTitleDialogTitle: string = "";
	editTitleDialogTitleError: string = "";
	editDescription: boolean = false;
	newDescription: string = "";
	newDescriptionError: string = "";
	languageSelectedKey: string = "en";
	updateLanguage: boolean = false;
	coverContent: string;
	uploadedCoverContent: string;
	bookFileUploaded: boolean = false;

	backButtonIconStyles: IIconStyles = {
		root: {
         fontSize: 18
		}
	}
	dialogPrimaryButtonStyles: IButtonStyles = {
		root: {
			marginLeft: 10
		}
	}
	editTitleDialogContentProps: IDialogContentProps = {
		title: this.locale.editTitleDialog.title
	}
	descriptionTextfieldStyles = {
		root: {
			marginTop: "3px",
			marginBottom: "16px",
			minWidth: "300px"
		}
	}
	
	constructor(
		private dataService: DataService,
		private websocketService: WebsocketService,
		private router: Router,
      private activatedRoute: ActivatedRoute
	){
		this.locale = this.dataService.GetLocale().authorBookPage;
		this.getStoreBookSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.GetStoreBook, (response: ApiResponse) => this.GetStoreBookResponse(response));
		this.updateStoreBookSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.UpdateStoreBook, (response: ApiResponse) => this.UpdateStoreBookResponse(response));
		this.getStoreBookCoverSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.GetStoreBookCover, (response: ApiResponse) => this.GetStoreBookCoverResponse(response));
		this.setStoreBookCoverSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.SetStoreBookCover, (response: ApiResponse) => this.SetStoreBookCoverResponse(response));
		this.setStoreBookFileSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.SetStoreBookFile, (response: ApiResponse) => this.SetStoreBookFileResponse(response));

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

		this.websocketService.Emit(WebsocketCallbackType.GetStoreBook, {
			jwt: this.dataService.user.JWT,
			uuid: this.uuid
		});
	}

	ngOnDestroy(){
		this.websocketService.Unsubscribe(
			this.getStoreBookSubscriptionKey,
			this.updateStoreBookSubscriptionKey,
			this.getStoreBookCoverSubscriptionKey,
			this.setStoreBookCoverSubscriptionKey,
			this.setStoreBookFileSubscriptionKey
		)
	}

	GoBack(){
		this.router.navigate(["author", "collection", this.book.collection]);
	}

	ShowEditTitleModal(){
		this.editTitleDialogTitle = this.book.title;
		this.editTitleDialogTitleError = "";

		this.editTitleDialogContentProps.title = this.locale.editTitleDialog.title;
		this.editTitleDialogVisible = true;
	}

	UpdateTitle(){
		this.websocketService.Emit(WebsocketCallbackType.UpdateStoreBook, {
			jwt: this.dataService.user.JWT,
			uuid: this.uuid,
			title: this.editTitleDialogTitle
		});
	}

	EditDescription(){
		if(this.editDescription){
			this.newDescriptionError = "";

			//	Save the new description on the server
			this.websocketService.Emit(WebsocketCallbackType.UpdateStoreBook, {
				jwt: this.dataService.user.JWT,
				uuid: this.uuid,
				description: this.newDescription
			});
		}else{
			this.newDescription = this.book.description ? this.book.description : "";
			this.newDescriptionError = "";
			this.editDescription = true;
		}
	}

	SetLanguage(e: {event: MouseEvent, option: {key: string, text: string}}){
		this.updateLanguage = true;

		this.websocketService.Emit(WebsocketCallbackType.UpdateStoreBook, {
			jwt: this.dataService.user.JWT,
			uuid: this.uuid,
			language: e.option.key
		});
	}

	async CoverUpload(file: ReadFile){
		// Get the content of the image file
		let reader = new FileReader();

		let readPromise: Promise<string> = new Promise((resolve) => {
			reader.addEventListener('loadend', (e) => {
				resolve(e.srcElement["result"]);
			});
		});

		reader.readAsBinaryString(new Blob([file.underlyingFile]));
		let imageContent = await readPromise;

		let image = new Image();
		let imageHeight = 0;
		let imageWidth = 0;

		let imageLoadPromise: Promise<null> = new Promise((resolve) => {
			image.onload = () => {
				imageHeight = image.height;
				imageWidth = image.width;
				resolve();
			}
		});

		let imageSrc = GetContentAsInlineSource(imageContent, file.type);

		image.src = imageSrc;
		await imageLoadPromise;

		// TODO: Validate the image dimensions

		// Upload the image
		this.websocketService.Emit(WebsocketCallbackType.SetStoreBookCover, {
			jwt: this.dataService.user.JWT,
			uuid: this.uuid,
			type: file.type,
			file: imageContent
		});

		this.uploadedCoverContent = imageSrc;
	}

	async BookFileUpload(file: ReadFile){
		let reader = new FileReader();

		let readPromise: Promise<string> = new Promise((resolve) => {
			reader.addEventListener('loadend', (e) => {
				resolve(e.srcElement["result"]);
			});
		});

		reader.readAsBinaryString(new Blob([file.underlyingFile]));
		let fileContent = await readPromise;

		// Upload the file
		this.websocketService.Emit(WebsocketCallbackType.SetStoreBookFile, {
			jwt: this.dataService.user.JWT,
			uuid: this.uuid,
			type: file.type,
			file: fileContent
		});
	}

	GetStoreBookResponse(response: ApiResponse){
		if(response.status == 200){
			this.book.collection = response.data.collection;
			this.book.title = response.data.title;
			this.book.description = response.data.description;
			this.languageSelectedKey = response.data.language;

			if(response.data.cover){
				// Download the cover
				this.websocketService.Emit(WebsocketCallbackType.GetStoreBookCover, {
					jwt: this.dataService.user.JWT,
					uuid: this.uuid
				});
			}

			this.bookFileUploaded = response.data.file;
		}else{
			// Redirect back to the author page
			this.router.navigate(['author']);
		}
	}

	UpdateStoreBookResponse(response: ApiResponse){
		if(this.editDescription){
			// The description was updated
			if(response.status == 200){
				this.book.description = response.data.description;
				this.editDescription = false;
			}else{
				let errorCode = response.data.errors[0].code;

				switch(errorCode){
					case 2305: 
						// Field too short: description
						this.newDescriptionError = this.locale.errors.descriptionTooShort;
						break;
					case 2405:
						// Field too long: description
						this.newDescriptionError = this.locale.errors.descriptionTooLong;
						break;
					default:
						this.newDescriptionError = this.locale.errors.unexpectedError;
						break;
				}
			}
		}else if(this.updateLanguage){
			this.updateLanguage = false;

			if(response.status == 200){
				this.languageSelectedKey = response.data.language;
			}
		}else{
			// The title was updated
			if(response.status == 200){
				this.book.title = response.data.title;
				this.editTitleDialogVisible = false;
			}else{
				let errorCode = response.data.errors[0].code;
	
				switch(errorCode){
					case 2304:
						// Field too short: title
						this.editTitleDialogTitleError = this.locale.errors.titleTooShort;
						break;
					case 2404:
						// Field too long: title
						this.editTitleDialogTitleError = this.locale.errors.titleTooLong;
						break;
					default:
						this.editTitleDialogTitleError = this.locale.errors.unexpectedError;
						break;
				}
			}
		}
	}

	GetStoreBookCoverResponse(response: ApiResponse){
		if(response.status == 200){
			this.coverContent = GetContentAsInlineSource(response.data, response.headers['content-type']);
		}
	}

	SetStoreBookCoverResponse(response: ApiResponse){
		if(response.status == 200){
			// Show the cover
			this.coverContent = this.uploadedCoverContent;
			this.uploadedCoverContent = null;
		}
	}

	SetStoreBookFileResponse(response: ApiResponse){
		this.bookFileUploaded = response.status == 200;
	}
}