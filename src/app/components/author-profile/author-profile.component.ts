import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { IDropdownOption, DropdownMenuItemType, IButtonStyles } from 'office-ui-fabric-react';
import { ReadFile } from 'ngx-file-helpers';
import { DataService, ApiResponse, FindNameWithAppropriateLanguage, GetContentAsInlineSource } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-author-profile',
	templateUrl: './author-profile.component.html'
})
export class AuthorProfileComponent{
	locale = enUS.authorPage;
	setProfileImageOfAuthorOfUserSubscriptionKey: number;
	getProfileImageOfAuthorOfUserSubscriptionKey: number;
	setBioOfAuthorOfUserSubscriptionKey: number;
	
	profileImageWidth: number = 200;
	bioLanguageDropdownSelectedIndex: number = 0;
	bioLanguageDropdownOptions: IDropdownOption[] = [];
	bioMode: BioMode = BioMode.None;
	newBio: string = "";
	newBioError: string = "";
	collections: {uuid: string, name: string}[] = [];
	profileImageContent: string = "https://davapps.blob.core.windows.net/avatars-dev/default.png";
	uploadedProfileImageContent: string;

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

	constructor(
		public dataService: DataService,
		private websocketService: WebsocketService,
		private router: Router
	){
		this.locale = this.dataService.GetLocale().authorPage;
		this.setProfileImageOfAuthorOfUserSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.SetProfileImageOfAuthorOfUser, (response: ApiResponse) => this.SetProfileImageOfAuthorOfUserResponse(response));
		this.getProfileImageOfAuthorOfUserSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.GetProfileImageOfAuthorOfUser, (response: ApiResponse) => this.GetProfileImageOfAuthorOfUserResponse(response));
		this.setBioOfAuthorOfUserSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.SetBioOfAuthorOfUser, (response: ApiResponse) => this.SetBioOfAuthorOfUserResponse(response));
	}

	async ngOnInit(){
		this.setSize();

		// Get the appropriate language of each collection
		for(let collection of this.dataService.userAuthor.collections){
			let i = FindNameWithAppropriateLanguage(this.dataService.locale.slice(0, 2), collection.names);
			if(i != -1) this.collections.push({uuid: collection.uuid, name: collection.names[i].name});
		}

		await this.dataService.userAuthorPromise;

		// Download the profile image
		this.websocketService.Emit(WebsocketCallbackType.GetProfileImageOfAuthorOfUser, {
			jwt: this.dataService.user.JWT
		});

		this.SetupBioLanguageDropdown();
	}

	ngOnDestroy(){
		this.websocketService.Unsubscribe(
			this.setProfileImageOfAuthorOfUserSubscriptionKey,
			this.getProfileImageOfAuthorOfUserSubscriptionKey,
			this.setBioOfAuthorOfUserSubscriptionKey
		)
	}

	@HostListener('window:resize')
	onResize(){
		this.setSize();
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

	ShowCollection(uuid: string){
		this.router.navigate(["author", "collection", uuid]);
	}

	SetupBioLanguageDropdown(){
		// Prepare the Bio language dropdown
		this.bioLanguageDropdownOptions = [];
		let i = 0;

		for(let lang of this.dataService.userAuthor.bios){
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
			this.bioLanguageDropdownSelectedIndex = 0;
			this.bioMode = BioMode.Normal;
		}
	}

	EditBio(){
		if(this.bioMode == BioMode.New || this.bioMode == BioMode.NormalEdit){
			this.newBioError = "";

			// Save the new bio on the server
			let selectedOption = this.bioLanguageDropdownOptions[this.bioLanguageDropdownSelectedIndex + (this.bioMode == BioMode.New && this.dataService.userAuthor.bios.length > 0 ? 1 : 0)];

			this.websocketService.Emit(WebsocketCallbackType.SetBioOfAuthorOfUser, {
				jwt: this.dataService.user.JWT,
				language: selectedOption.data.language,
				bio: this.newBio
			});
		}else{
			this.newBio = this.dataService.userAuthor.bios[this.bioLanguageDropdownSelectedIndex].bio;
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
			type: file.type,
			file: imageContent
		});

		this.uploadedProfileImageContent = GetContentAsInlineSource(imageContent, file.type);
	}

	SetProfileImageOfAuthorOfUserResponse(response: ApiResponse){
		if(response.status == 200){
			// Show the uploaded profile image
			this.profileImageContent = this.uploadedProfileImageContent;
			this.uploadedProfileImageContent = null;
		}
	}

	GetProfileImageOfAuthorOfUserResponse(response: ApiResponse){
		if(response.status == 200){
			// Show the profile image
			this.profileImageContent = GetContentAsInlineSource(response.data, response.headers['content-type']);
		}
	}

	SetBioOfAuthorOfUserResponse(response: ApiResponse){
		if(response.status == 200){
			if(this.bioMode == BioMode.New){
				// Add the new bio to the bios
				this.dataService.userAuthor.bios.push(response.data);

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
				let i = this.dataService.userAuthor.bios.findIndex(bio => bio.language == response.data.language);
				if(i != -1){
					this.dataService.userAuthor.bios[i].bio = response.data.bio;
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
}

enum BioMode{
	None = 0,		// If the author has no bios and has not selected to add a bio, show nothing
	New = 1,			// If the author has selected a language to add, show the input for creating a bio
	Normal = 2,		// If the author has one or more bios, show the selected bio
	NormalEdit = 3	// If the author has one or more bios and the user is editing the bio of the selected language
}