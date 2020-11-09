import { Component, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IButtonStyles, IDialogContentProps } from 'office-ui-fabric-react';
import { ReadFile } from 'ngx-file-helpers';
import { ApiResponse } from 'dav-npm';
import {
	DataService,
	BookStatus,
	GetBookStatusByString,
	GetStoreBookCoverLink
} from 'src/app/services/data-service';
import { ApiService } from 'src/app/services/api-service';
import { CategoriesSelectionComponent } from 'src/app/components/categories-selection/categories-selection.component';
import { EditPriceComponent } from 'src/app/components/edit-price/edit-price.component';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-author-book-page',
	templateUrl: './author-book-page.component.html'
})
export class AuthorBookPageComponent{
	locale = enUS.authorBookPage
	@ViewChild('editPrice', { static: true }) editPriceComponent: EditPriceComponent
	@ViewChild('categoriesSelection', { static: true }) categoriesSelectionComponent: CategoriesSelectionComponent
	uuid: string;
	book: {
		collection: string,
		title: string,
		description: string,
		language: string,
		price: number,
		status: BookStatus,
		coverBlurhash: string,
		categories: {
			key: string,
			name: string
		}[]
	} = {
		collection: "",
		title: "",
		description: "",
		language: "en",
		price: 0,
		status: BookStatus.Unpublished,
		coverBlurhash: null,
		categories: []
	}
	editTitleDialogVisible: boolean = false
	editTitleDialogTitle: string = ""
	editTitleDialogTitleError: string = ""
	editDescription: boolean = false
	newDescription: string = ""
	newDescriptionError: string = ""
	updateLanguage: boolean = false
	coverContent: string
	bookFileUploaded: boolean = false
	publishingOrUnpublishing: boolean = false
	editPrice: boolean = false
	categoriesSelectionDialogVisible: boolean = false

	dialogPrimaryButtonStyles: IButtonStyles = {
		root: {
			marginLeft: 10
		}
	}
	editTitleDialogContentProps: IDialogContentProps = {
		title: this.locale.editTitleDialog.title
	}
	categoriesSelectionDialogContentProps: IDialogContentProps = {
		title: this.locale.categoriesSelectionDialog.title
	}
	descriptionTextfieldStyles = {
		root: {
			marginTop: "3px",
			marginBottom: "16px",
			minWidth: "300px"
		}
	}

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private router: Router,
      private activatedRoute: ActivatedRoute
	){
		this.locale = this.dataService.GetLocale().authorBookPage

		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid')
	}

	async ngOnInit(){
		// Wait for the user to be loaded
		await this.dataService.userPromiseHolder.AwaitResult()
		await this.dataService.userAuthorPromiseHolder.AwaitResult()
		await this.dataService.adminAuthorsPromiseHolder.AwaitResult()

		// Redirect back to the author page if the user is not an author
		if(!this.dataService.userAuthor && !this.dataService.userIsAdmin){
			this.router.navigate(['author'])
		}

		// Get the store book
		let response: ApiResponse<any> = await this.apiService.GetStoreBook({
			jwt: this.dataService.user.JWT,
			uuid: this.uuid
		})

		if(response.status == 200){
			this.book.collection = response.data.collection
			this.book.title = response.data.title
			this.book.description = response.data.description
			this.book.language = response.data.language
			this.book.price = response.data.price
			this.book.status = GetBookStatusByString(response.data.status)
			this.book.coverBlurhash = response.data.cover_blurhash

			// Get the categories
			await this.dataService.categoriesPromiseHolder.AwaitResult()
			this.LoadCategories(response.data.categories)

			this.editPriceComponent.SetPrice(this.book.price)

			if(response.data.cover){
				this.coverContent = GetStoreBookCoverLink(this.uuid)
			}

			this.bookFileUploaded = response.data.file
		}else{
			// Redirect back to the author page
			this.router.navigate(['author'])
		}
	}

	GoBack() {
		// Check if this is the only book in the collection
		let skipCollection = false;
		let authorUuid: string;

		if (this.dataService.userIsAdmin) {
			let collectionFound = false;

			for (let author of this.dataService.adminAuthors) {
				for (let collection of author.collections) {
					if (collection.uuid == this.book.collection) {
						collectionFound = true;
						skipCollection = collection.books.length == 1;
						authorUuid = author.uuid;
						break;
					}
				}

				if (collectionFound) break;
			}
		} else {
			for (let collection of this.dataService.userAuthor.collections) {
				if (collection.uuid == this.book.collection) {
					skipCollection = collection.books.length == 1;
					break;
				}
			}
		}

		if (skipCollection && this.dataService.userIsAdmin) {
			this.router.navigate(["author", authorUuid]);
		} else if (skipCollection) {
			this.router.navigate(["author"]);
		} else {
			this.router.navigate(["author", "collection", this.book.collection]);
		}
	}

	LoadCategories(keys: string[]) {
		this.book.categories = [];

		for (let key of keys) {
			// Find the category with the key
			let category = this.dataService.categories.find(c => c.key == key);

			if (category) {
				this.book.categories.push({
					key: category.key,
					name: category.name
				})
			}
		}
	}

	ShowEditTitleDialog(){
		this.editTitleDialogTitle = this.book.title;
		this.editTitleDialogTitleError = "";

		this.editTitleDialogContentProps.title = this.locale.editTitleDialog.title;
		this.editTitleDialogVisible = true;
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

	ShowCategoriesDialog() {
		// Get the category keys of the book
		let keys: string[] = [];
		this.book.categories.forEach(c => keys.push(c.key));
		this.categoriesSelectionComponent.SetSelectedCategories(keys);

		this.categoriesSelectionDialogContentProps.title = this.locale.categoriesSelectionDialog.title;
		this.categoriesSelectionDialogVisible = true;
	}

	async UpdateCategories() {
		let categories = this.categoriesSelectionComponent.GetSelectedCategories();

		// Update the categories on the server
		await this.apiService.UpdateStoreBook({
			jwt: this.dataService.user.JWT,
			uuid: this.uuid,
			categories
		})

		this.LoadCategories(categories);
		this.categoriesSelectionDialogVisible = false;
	}

	async UpdatePrice(price: number) {
		this.editPrice = true;

		this.UpdateStoreBookResponse(
			await this.apiService.UpdateStoreBook({
				jwt: this.dataService.user.JWT,
				uuid: this.uuid,
				price
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
		} else if (this.editPrice) {
			this.editPrice = false;

			// The price was updated
			if(response.status == 200){
				this.book.price = response.data.price;
				this.editPriceComponent.SetPrice(this.book.price);
			}else{
				let errorCode = response.data.errors[0].code;

				switch(errorCode){
					case 2501:	// Price invalid
						this.editPriceComponent.SetError(this.locale.errors.priceInvalid)
						break;
					default:		// Unexpected error
						this.editPriceComponent.SetError(this.locale.errors.unexpectedError)
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