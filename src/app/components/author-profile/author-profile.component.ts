import { Component, Input, HostListener } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { IDropdownOption, DropdownMenuItemType, IButtonStyles, IDialogContentProps } from 'office-ui-fabric-react';
import { ReadFile } from 'ngx-file-helpers';
import { ApiResponse } from 'dav-npm';
import {
	DataService,
	FindAppropriateLanguage,
	GetAuthorProfileImageLink,
	GetStoreBookCoverLink,
	Author,
	AuthorMode,
	BookStatus
} from 'src/app/services/data-service';
import { ApiService } from 'src/app/services/api-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-author-profile',
	templateUrl: './author-profile.component.html'
})
export class AuthorProfileComponent{
	locale = enUS.authorProfile;
	@Input() uuid: string;
	authorMode: AuthorMode = AuthorMode.Normal;
	author: Author = {uuid: "", firstName: "", lastName: "", bios: [], collections: [], profileImage: false};
	books: {uuid: string, title: string, description: string, language: string, coverContent: string}[] = [];
	profileImageWidth: number = 200;
	bioLanguageDropdownSelectedIndex: number = 0;
	bioLanguageDropdownOptions: IDropdownOption[] = [];
	bioMode: BioMode = BioMode.None;
	newBio: string = "";
	newBioError: string = "";
	collections: {
		uuid: string,
		name: string,
		books: {
			uuid: string,
			title: string,
			description: string,
			language: string,
			status: BookStatus,
			cover: boolean,
			coverContent: string,
			file: boolean
		}[]
	}[] = [];
	profileImageContent: string = this.dataService.defaultAvatar;
	createCollectionDialogVisible: boolean = false;
	createCollectionDialogName: string = "";
	createCollectionDialogNameError: string = "";
	hoveredBookIndex: number = -1;
	addBookHover: boolean = false;
	bookTitleFontSize: number = 20;

	bioTextfieldStyles = {
		root: {
			marginTop: "10px"
		}
	}
	cancelButtonStyles: IButtonStyles = {
		root: {
			marginLeft: 10
		}
	}
	createCollectionDialogContentProps: IDialogContentProps = {
		title: this.locale.createCollectionDialog.title
	}

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private router: Router
	){
		this.locale = this.dataService.GetLocale().authorProfile;
	}

	async ngOnInit(){
		this.setSize();
		await this.dataService.userAuthorPromise;

		// Determine the author mode
		if(!this.uuid){
			this.authorMode = AuthorMode.AuthorOfUser;
		}else if(
			this.dataService.userIsAdmin && 
			(this.dataService.adminAuthors.findIndex(author => author.uuid == this.uuid) != -1)){
			this.authorMode = AuthorMode.AuthorOfAdmin;
		}

		if(this.authorMode == AuthorMode.AuthorOfAdmin){
			// Get the author from the admin authors
			this.author = this.dataService.adminAuthors.find(author => author.uuid == this.uuid);
			this.SelectDefaultBio();
		}else if(this.authorMode == AuthorMode.AuthorOfUser){
			this.author = this.dataService.userAuthor;
			this.SelectDefaultBio();
		}else{
			// Get the author from the server
			await this.LoadAuthor();
		}

		if(this.author.profileImage){
			// Set the author profile image link
			this.profileImageContent = GetAuthorProfileImageLink(this.author.uuid);
		}

		// Get the appropriate language of each collection
		for(let collection of this.author.collections){
			let i = FindAppropriateLanguage(this.dataService.locale.slice(0, 2), collection.names);

			this.collections.push({
				uuid: collection.uuid,
				name: collection.names[i].name,
				books: collection.books
			})
		}

		this.SetupBioLanguageDropdown();
	}

	ngAfterViewInit(){
		this.UpdateFontSize();
	}

	@HostListener('window:resize')
	onResize(){
		this.setSize();
		this.UpdateFontSize();
	}

	setSize(){
		if(window.innerWidth < 768){
			this.profileImageWidth = 110;
		}else if(window.innerWidth < 1200){
			this.profileImageWidth = 120;
		}else{
			this.profileImageWidth = 130;
		}
	}

	UpdateFontSize(){
		let bookListItems = document.getElementsByClassName('book-list-item');
		if(bookListItems.length == 0) return;

		let bookItemStyles = getComputedStyle(bookListItems.item(0));
		let bookItemWidth = +bookItemStyles.width.replace('px', '');

		if(bookItemWidth <= 360){
			this.bookTitleFontSize = 17;
		}else if(bookItemWidth <= 400){
			this.bookTitleFontSize = 18;
		}else if(bookItemWidth <= 470){
			this.bookTitleFontSize = 19;
		}else{
			this.bookTitleFontSize = 20;
		}
	}

	SelectDefaultBio(){
		this.bioLanguageDropdownSelectedIndex = FindAppropriateLanguage(this.dataService.locale.slice(0, 2), this.author.bios);
	}

	NavigateToCollection(uuid: string){
		this.router.navigate(["author", "collection", uuid]);
	}

	NavigateToStoreBook(uuid: string){
		this.router.navigate(["store", "book", uuid]);
	}

	SetupBioLanguageDropdown(){
		if(this.authorMode == AuthorMode.Normal) return;

		// Prepare the Bio language dropdown
		this.bioLanguageDropdownOptions = [];
		let i = 0;

		for(let lang of this.author.bios){
			this.bioLanguageDropdownOptions.push({
				key: i,
				text: this.dataService.GetFullLanguage(lang.language),
				data: {
					language: lang.language,
					added: true
				}
			});

			i++;
		}

		if(this.bioLanguageDropdownOptions.length == 0){
			this.bioMode = BioMode.None;

			// Add default item
			this.bioLanguageDropdownOptions.push({
				key: 0,
				text: this.locale.addYourBio
			});

			i++;

			// Add each supported language
			for(let supportedLanguage of this.dataService.supportedLanguages){
				this.bioLanguageDropdownOptions.push({
					key: i,
					text: supportedLanguage.fullLanguage,
					data: {
						language: supportedLanguage.language,
						added: false
					}
				});

				i++;
			}
		}else{
			// Add a divider and all possible languages to add
			let newOptions: IDropdownOption[] = [{
				key: "header",
				text: this.locale.additionalLanguages,
				itemType: DropdownMenuItemType.Header
			}];

			for(let supportedLanguage of this.dataService.supportedLanguages){
				// Check if there is a bio with the supported language
				let index = this.bioLanguageDropdownOptions.findIndex(option => option.data.language == supportedLanguage.language);

				if(index == -1){
					// There is no bio in that language
					// Add an option to add that language
					newOptions.push({
						key: i,
						text: supportedLanguage.fullLanguage,
						data: {
							language: supportedLanguage.language,
							added: false
						}
					});

					i++;
				}
			}

			if(newOptions.length > 1){
				for(let option of newOptions){
					this.bioLanguageDropdownOptions.push(option);
				}
			}

			// Select and show the first language
			this.bioMode = BioMode.Normal;
		}
	}

	async EditBio(){
		if(this.bioMode == BioMode.New || this.bioMode == BioMode.NormalEdit){
			this.newBioError = "";

			// Save the new bio on the server
			let selectedOption = this.bioLanguageDropdownOptions[this.bioLanguageDropdownSelectedIndex + (this.bioMode == BioMode.New && this.author.bios.length > 0 ? 1 : 0)];

			if(this.authorMode == AuthorMode.AuthorOfUser){
				this.ProcessSetBioResponse(
					await this.apiService.SetBioOfAuthorOfUser({
						jwt: this.dataService.user.JWT,
						language: selectedOption.data.language,
						bio: this.newBio
					})
				)
			}else{
				this.ProcessSetBioResponse(
					await this.apiService.SetBioOfAuthor({
						jwt: this.dataService.user.JWT,
						uuid: this.uuid,
						language: selectedOption.data.language,
						bio: this.newBio
					})
				)
			}
		}else{
			this.newBio = this.author.bios[this.bioLanguageDropdownSelectedIndex].bio;
			this.newBioError = "";
			this.bioMode = BioMode.NormalEdit;
		}
	}

	CancelEditBio(){
		this.bioMode = 2;
		this.newBio = "";
		this.newBioError = "";
	}

	BioLanguageDropdownChange(e: {event: MouseEvent, option: {key: number, text: string, data: any}, index: number}){
		this.bioLanguageDropdownSelectedIndex = e.option.key;
		this.newBioError = "";

		if(!e.option.data){
			this.bioMode = BioMode.None;
		}else{
			this.bioMode = e.option.data.added ? BioMode.Normal : BioMode.New;
		}
	}

	async UploadProfileImage(file: ReadFile){
		// Get the content of the image file
		let readPromise: Promise<ArrayBuffer> = new Promise((resolve) => {
			let reader = new FileReader();
			reader.addEventListener('loadend', () => {
				resolve(reader.result as ArrayBuffer);
			});
			reader.readAsArrayBuffer(new Blob([file.underlyingFile]));
		});

		let imageContent = await readPromise;
		this.profileImageContent = file.content;

		// Upload the image
		let response: ApiResponse<any>;

		if(this.authorMode == AuthorMode.AuthorOfUser){
			response = await this.apiService.SetProfileImageOfAuthorOfUser({
				jwt: this.dataService.user.JWT,
				type: file.type,
				file: imageContent
			})
		}else{
			response = await this.apiService.SetProfileImageOfAuthor({
				jwt: this.dataService.user.JWT,
				uuid: this.uuid,
				type: file.type,
				file: imageContent
			})
		}

		if(response.status == 200){
			// Show the uploaded profile image
			this.author.profileImage = true;
		}
	}

	ShowCreateCollectionDialog(){
		this.createCollectionDialogName = "";
		this.createCollectionDialogNameError = "";

		this.createCollectionDialogContentProps.title = this.locale.createCollectionDialog.title;
		this.createCollectionDialogVisible = true;
	}

	NavigateToNewBookPage() {
		let extras: NavigationExtras = {};

		if (this.dataService.userIsAdmin) {
			extras.queryParams = {
				author: this.author.uuid
			}
		}

		this.router.navigate(["author", "book", "new"], extras);
	}

	async CreateCollection(){
		this.createCollectionDialogNameError = "";

		let response: ApiResponse<any> = await this.apiService.CreateStoreBookCollection({
			jwt: this.dataService.user.JWT,
			author: this.authorMode == AuthorMode.AuthorOfAdmin ? this.author.uuid : null,
			name: this.createCollectionDialogName,
			language: this.dataService.locale.slice(0, 2)
		})

		if(response.status == 201){
			// Add the collection to the author in DataService
			this.author.collections.push(response.data)
			this.collections.push({
				uuid: response.data.uuid,
				name: response.data.names[0].name,
				books: []
			})
			
			// Redirect to the collection page
			this.router.navigate(['author', 'collection', response.data.uuid]);
		}else{
			let errorCode = response.data.errors[0].code;

			switch(errorCode){
				case 2108:	// Missing field: name
					this.createCollectionDialogNameError = this.locale.createCollectionDialog.errors.nameMissing;
					break;
				case 2307:	// Field too short: name
					this.createCollectionDialogNameError = this.locale.createCollectionDialog.errors.nameTooShort;
					break;
				case 2407:	// Field too long: name
					this.createCollectionDialogNameError = this.locale.createCollectionDialog.errors.nameTooLong;
					break;
				default:		// Unexpected error
					this.createCollectionDialogNameError = this.locale.createCollectionDialog.errors.unexpectedError;
					break;
			}
		}
	}

	ProcessSetBioResponse(response: ApiResponse<any>){
		if(response.status == 200){
			if(this.bioMode == BioMode.New){
				// Add the new bio to the bios
				this.author.bios.push(response.data);

				// Update the dropdown
				this.bioMode = BioMode.Normal;
				this.newBio = "";
				this.newBioError = "";
				this.SetupBioLanguageDropdown();

				// Show the bio in the language that was just added
				let i = this.bioLanguageDropdownOptions.findIndex(option => option.data.language == response.data.language);
				if(i != -1){
					this.bioLanguageDropdownSelectedIndex = this.bioLanguageDropdownOptions[i].key as number;
				}
			}else{
				// Find and update the edited bio
				let i = this.author.bios.findIndex(bio => bio.language == response.data.language);
				if(i != -1){
					this.author.bios[i].bio = response.data.bio;
				}

				this.newBio = "";
				this.newBioError = "";
				this.bioMode = BioMode.Normal;
			}
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

	async LoadAuthor(){
		let response: ApiResponse<any> = await this.apiService.GetAuthor({
			uuid: this.uuid,
			books: true,
			language: this.dataService.locale.slice(0, 2)
		});

		if(response.status == 200){
			this.author = {
				uuid: response.data.uuid,
				firstName: response.data.first_name,
				lastName: response.data.last_name,
				bios: response.data.bios,
				collections: [],
				profileImage: response.data.profile_image
			}

			for(let book of response.data.books){
				this.books.push({
					uuid: book.uuid,
					title: book.title,
					description: book.description,
					language: book.language,
					coverContent: GetStoreBookCoverLink(book.uuid)
				});
			}

			this.bioMode = BioMode.Normal;
			this.SelectDefaultBio();
		}
	}
}

enum BioMode{
	None = 0,		// If the author has no bios and has not selected to add a bio, show nothing
	New = 1,			// If the author has selected a language to add, show the input for creating a bio
	Normal = 2,		// If the author has one or more bios, show the selected bio
	NormalEdit = 3	// If the author has one or more bios and the user is editing the bio of the selected language
}