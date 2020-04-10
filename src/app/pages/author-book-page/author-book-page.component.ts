import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IIconStyles, IButtonStyles, IDialogContentProps } from 'office-ui-fabric-react';
import { ReadFile } from 'ngx-file-helpers';
import { ApiResponse } from 'dav-npm';
import {
	DataService,
	BookStatus,
	GetBookStatusByString,
	GetStoreBookCoverLink
} from 'src/app/services/data-service';
import { ApiService } from 'src/app/services/api-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-author-book-page',
	templateUrl: './author-book-page.component.html'
})
export class AuthorBookPageComponent{
	locale = enUS.authorBookPage;
	uuid: string;
	book: {
		collection: string,
		title: string,
		description: string,
		language: string,
		price: number,
		status: BookStatus
	} = {
		collection: "",
		title: "",
		description: "",
		language: "en",
		price: 0,
		status: BookStatus.Unpublished
	}
	price: string = "";
	editTitleDialogVisible: boolean = false;
	editTitleDialogTitle: string = "";
	editTitleDialogTitleError: string = "";
	editDescription: boolean = false;
	newDescription: string = "";
	newDescriptionError: string = "";
	updateLanguage: boolean = false;
	coverContent: string;
	bookFileUploaded: boolean = false;
	publishingOrUnpublishing: boolean = false;
	editPriceDialogVisible: boolean = false;
	editPriceDialogPrice: string = "0";
	editPriceDialogPriceError: string = "";

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
	editPriceDialogContentProps: IDialogContentProps = {
		title: this.locale.editPriceDialog.title
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
		private apiService: ApiService,
		private router: Router,
      private activatedRoute: ActivatedRoute
	){
		this.locale = this.dataService.GetLocale().authorBookPage;

		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid');
	}

	async ngOnInit(){
		// Wait for the user to be loaded
		await this.dataService.userPromise;
		await this.dataService.userAuthorPromise;
		await this.dataService.adminAuthorsPromise;

		// Redirect back to the author page if the user is not an author
		if(!this.dataService.userAuthor && !this.dataService.userIsAdmin){
			this.router.navigate(['author']);
		}

		// Get the store book
		let response: ApiResponse<any> = await this.apiService.GetStoreBook({
			jwt: this.dataService.user.JWT,
			uuid: this.uuid
		})

		if(response.status == 200){
			this.book.collection = response.data.collection;
			this.book.title = response.data.title;
			this.book.description = response.data.description;
			this.book.language = response.data.language;
			this.book.price = response.data.price;
			this.book.status = GetBookStatusByString(response.data.status);

			this.UpdatePriceString();

			if(response.data.cover){
				this.coverContent = GetStoreBookCoverLink(this.uuid);
			}

			this.bookFileUploaded = response.data.file;
		}else{
			// Redirect back to the author page
			this.router.navigate(['author']);
		}
	}

	GoBack(){
		this.router.navigate(["author", "collection", this.book.collection]);
	}

	UpdatePriceString(){
		if(this.book.price == 0){
			this.price = this.locale.free;
		}else{
			this.price = (this.book.price / 100).toFixed(2) + " €";

			if(this.dataService.locale.slice(0, 2) == "de"){
				this.price = this.price.replace('.', ',');
			}
		}
	}

	ShowEditTitleModal(){
		this.editTitleDialogTitle = this.book.title;
		this.editTitleDialogTitleError = "";

		this.editTitleDialogContentProps.title = this.locale.editTitleDialog.title;
		this.editTitleDialogVisible = true;
	}

	ShowEditPriceDialog(){
		this.editPriceDialogPrice = this.book.price.toString();
		this.editPriceDialogPriceError = "";

		this.editPriceDialogContentProps.title = this.locale.editPriceDialog.title;
		this.editPriceDialogVisible = true;
	}

	async UpdateTitle(){
		this.UpdateStoreBookResponse(
			await this.apiService.UpdateStoreBook({
				jwt: this.dataService.user.JWT,
				uuid: this.uuid,
				title: this.editTitleDialogTitle
			})
		)
	}

	async UpdatePrice(){
		this.UpdateStoreBookResponse(
			await this.apiService.UpdateStoreBook({
				jwt: this.dataService.user.JWT,
				uuid: this.uuid,
				price: parseInt(this.editPriceDialogPrice)
			})
		)
	}

	async EditDescription(){
		if(this.editDescription){
			this.newDescriptionError = "";

			//	Save the new description on the server
			this.UpdateStoreBookResponse(
				await this.apiService.UpdateStoreBook({
					jwt: this.dataService.user.JWT,
					uuid: this.uuid,
					description: this.newDescription
				})
			)
		}else{
			this.newDescription = this.book.description ? this.book.description : "";
			this.newDescriptionError = "";
			this.editDescription = true;
		}
	}

	async SetLanguage(language: string){
		this.updateLanguage = true;

		this.UpdateStoreBookResponse(
			await this.apiService.UpdateStoreBook({
				jwt: this.dataService.user.JWT,
				uuid: this.uuid,
				language
			})
		)
	}

	async CoverUpload(file: ReadFile){
		// Get the content of the image file
		let readPromise: Promise<ArrayBuffer> = new Promise(resolve => {
			let reader = new FileReader();
			reader.addEventListener('loadend', () => {
				resolve(reader.result as ArrayBuffer);
			});
			reader.readAsArrayBuffer(new Blob([file.underlyingFile]));
		});

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

		image.src = file.content;
		await imageLoadPromise;

		// TODO: Validate the image dimensions
		this.coverContent = file.content;

		// Upload the image
		await this.apiService.SetStoreBookCover({
			jwt: this.dataService.user.JWT,
			uuid: this.uuid,
			type: file.type,
			file: imageContent
		})
	}

	async BookFileUpload(file: ReadFile){
		let readPromise: Promise<ArrayBuffer> = new Promise((resolve) => {
			let reader = new FileReader();
			reader.addEventListener('loadend', () => {
				resolve(reader.result as ArrayBuffer);
			});
			reader.readAsArrayBuffer(new Blob([file.underlyingFile]));
		});

		let fileContent = await readPromise;

		// Upload the file
		let response: ApiResponse<any> = await this.apiService.SetStoreBookFile({
			jwt: this.dataService.user.JWT,
			uuid: this.uuid,
			type: file.type,
			file: fileContent
		})

		this.bookFileUploaded = response.status == 200;
	}

	async PublishOrUnpublishBook(published: boolean){
		this.publishingOrUnpublishing = true;

		this.UpdateStoreBookResponse(
			await this.apiService.UpdateStoreBook({
				jwt: this.dataService.user.JWT,
				uuid: this.uuid,
				published
			})
		)
	}

	UpdateStoreBookResponse(response: ApiResponse<any>){
		if(this.editDescription){
			// The description was updated
			if(response.status == 200){
				this.book.description = response.data.description;
				this.editDescription = false;
			}else{
				let errorCode = response.data.errors[0].code;

				switch(errorCode){
					case 2305:	// Field too short: description
						this.newDescriptionError = this.locale.errors.descriptionTooShort;
						break;
					case 2405:	// Field too long: description
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
				this.book.language = response.data.language;
			}
		}else if(this.editPriceDialogVisible){
			// The price was updated
			if(response.status == 200){
				this.book.price = response.data.price;
				this.UpdatePriceString();
				this.editPriceDialogVisible = false;
			}else{
				let errorCode = response.data.errors[0].code;

				switch(errorCode){
					case 2501:	// Price invalid
						this.editPriceDialogPriceError = this.locale.errors.priceInvalid;
						break;
					default:		// Unexpected error
						this.editPriceDialogPriceError = this.locale.errors.unexpectedError;
						break;
				}
			}
		}else if(this.publishingOrUnpublishing){
			this.publishingOrUnpublishing = false;
			
			if(response.status == 200){
				this.book.status = GetBookStatusByString(response.data.status);
			}
		}else{
			// The title was updated
			if(response.status == 200){
				this.book.title = response.data.title;
				this.editTitleDialogVisible = false;
			}else{
				let errorCode = response.data.errors[0].code;
	
				switch(errorCode){
					case 2304:	// Field too short: title
						this.editTitleDialogTitleError = this.locale.errors.titleTooShort;
						break;
					case 2404:	// Field too long: title
						this.editTitleDialogTitleError = this.locale.errors.titleTooLong;
						break;
					default:
						this.editTitleDialogTitleError = this.locale.errors.unexpectedError;
						break;
				}
			}
		}
	}
}