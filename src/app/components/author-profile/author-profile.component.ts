import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core'
import { Router, NavigationExtras } from '@angular/router'
import {
	IDropdownOption,
	DropdownMenuItemType,
	IButtonStyles,
	IDialogContentProps,
	MessageBarType
} from 'office-ui-fabric-react'
import { ReadFile } from 'ngx-file-helpers'
import { faGlobe } from '@fortawesome/free-solid-svg-icons'
import { faFacebook, faInstagram, faTwitter } from '@fortawesome/free-brands-svg-icons'
import { Dav, ApiResponse } from 'dav-js'
import {
	DataService,
	FindAppropriateLanguage,
	Author,
	AuthorMode,
	BookStatus
} from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { GetDualScreenSettings, UpdateDialogForDualScreenLayout } from 'src/app/misc/utils'
import { BookListItem } from 'src/app/misc/types'
import * as ErrorCodes from 'src/constants/errorCodes'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-author-profile',
	templateUrl: './author-profile.component.html'
})
export class AuthorProfileComponent {
	locale = enUS.authorProfile
	faGlobe = faGlobe
	faFacebook = faFacebook
	faInstagram = faInstagram
	faTwitter = faTwitter
	@Input() uuid: string
	@Output() loaded = new EventEmitter()
	width: number = 500
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	storeContext: boolean = true		// Whether the component is shown in the Store
	authorMode: AuthorMode = AuthorMode.Normal
	author: Author = {
		uuid: "",
		firstName: "",
		lastName: "",
		websiteUrl: "",
		facebookUsername: "",
		instagramUsername: "",
		twitterUsername: "",
		bios: [],
		collections: [],
		profileImage: false,
		profileImageBlurhash: null
	}
	facebookLink: string = ""
	instagramLink: string = ""
	twitterLink: string = ""
	books: BookListItem[] = []
	profileImageWidth: number = 200
	bioLanguageDropdownSelectedIndex: number = 0
	bioLanguageDropdownOptions: IDropdownOption[] = []
	bioMode: BioMode = BioMode.None
	newBio: string = ""
	newBioError: string = ""
	bioLoading: boolean = false
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
			coverBlurhash: string,
			file: boolean
		}[]
	}[] = []
	profileImageLoading: boolean = false
	profileImageContent: string = this.dataService.defaultProfileImageUrl
	profileImageAlt: string = ""
	hoveredBookIndex: number = -1
	bookTitleFontSize: number = 20
	messageBarType: MessageBarType = MessageBarType.warning
	showProviderMessage: boolean = false
	providerMessage: string = ""

	//#region EditProfileDialog
	editProfileDialogVisible: boolean = false
	editProfileDialogFirstName: string = ""
	editProfileDialogLastName: string = ""
	editProfileDialogFirstNameError: string = ""
	editProfileDialogLastNameError: string = ""
	editProfileDialogWebsiteUrl: string = ""
	editProfileDialogWebsiteUrlError: string = ""
	editProfileDialogFacebookUsername: string = ""
	editProfileDialogFacebookUsernameError: string = ""
	editProfileDialogInstagramUsername: string = ""
	editProfileDialogInstagramUsernameError: string = ""
	editProfileDialogTwitterUsername: string = ""
	editProfileDialogTwitterUsernameError: string = ""
	//#endregion

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
	editProfileDialogContentProps: IDialogContentProps = {
		title: this.locale.editProfileDialog.title
	}

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private router: Router
	) {
		this.locale = this.dataService.GetLocale().authorProfile

		// Check if this is a dual-screen device with a vertical fold
		let dualScreenSettings = GetDualScreenSettings()
		this.dualScreenLayout = dualScreenSettings.dualScreenLayout
		this.dualScreenFoldMargin = dualScreenSettings.dualScreenFoldMargin

		this.storeContext = this.dataService.currentUrl.startsWith("/store")
	}

	async ngOnInit() {
		this.setSize()

		await this.dataService.userPromiseHolder.AwaitResult()
		await this.dataService.userAuthorPromiseHolder.AwaitResult()

		// Determine the author mode
		if (!this.uuid) {
			this.authorMode = AuthorMode.AuthorOfUser
		} else if (
			this.dataService.userIsAdmin
			&& (this.dataService.adminAuthors.findIndex(author => author.uuid == this.uuid) != -1)
		) {
			this.authorMode = AuthorMode.AuthorOfAdmin
		}

		if (this.authorMode == AuthorMode.AuthorOfAdmin) {
			// Get the author from the admin authors
			this.author = this.dataService.adminAuthors.find(author => author.uuid == this.uuid)
			this.UpdateSocialMediaLinks()
			this.SelectDefaultBio()
		} else if (this.authorMode == AuthorMode.AuthorOfUser) {
			this.author = this.dataService.userAuthor
			this.UpdateSocialMediaLinks()
			this.SelectDefaultBio()

			// Set the text and visibility for the provider message
			this.providerMessage = this.locale.messages.providerMessage.replace('{0}', Dav.GetUserPageLink('provider'))
			this.showProviderMessage = !this.dataService.dav.user.Provider
		} else {
			// Get the author from the server
			await this.LoadAuthor()
		}

		if (this.author.profileImage) {
			// Set the author profile image
			this.profileImageContent = (await this.apiService.GetProfileImageOfAuthor({ uuid: this.author.uuid })).data
		}

		// Get the appropriate language of each collection
		for (let collection of this.author.collections) {
			let i = FindAppropriateLanguage(this.dataService.supportedLocale, collection.names)

			this.collections.push({
				uuid: collection.uuid,
				name: collection.names[i].name,
				books: collection.books
			})
		}

		this.SetupBioLanguageDropdown()
		this.profileImageAlt = this.dataService.GetLocale().misc.authorProfileImageAlt.replace('{0}', `${this.author.firstName} ${this.author.lastName}`)
		this.loaded.emit()
	}

	@HostListener('window:resize')
	onResize() {
		this.setSize()
	}

	setSize() {
		this.width = window.innerWidth

		if (window.innerWidth < 768) {
			this.profileImageWidth = 110
		} else if (window.innerWidth < 1200) {
			this.profileImageWidth = 120
		} else {
			this.profileImageWidth = 130
		}
	}

	SelectDefaultBio() {
		this.bioLanguageDropdownSelectedIndex = FindAppropriateLanguage(this.dataService.supportedLocale, this.author.bios)
		if (this.bioLanguageDropdownSelectedIndex < 0) this.bioLanguageDropdownSelectedIndex = 0
	}

	NavigateToCollection(uuid: string) {
		this.router.navigate(["author", "collection", uuid])
	}

	NavigateToAuthorStoreBook(uuid: string) {
		this.router.navigate(["author", "book", uuid])
	}

	NavigateToStoreBook(uuid: string) {
		this.router.navigate(["store", "book", uuid])
	}

	SetupBioLanguageDropdown() {
		if (this.authorMode == AuthorMode.Normal) return

		// Prepare the Bio language dropdown
		this.bioLanguageDropdownOptions = []
		let i = 0

		for (let lang of this.author.bios) {
			this.bioLanguageDropdownOptions.push({
				key: i,
				text: this.dataService.GetFullLanguage(lang.language),
				data: {
					language: lang.language,
					added: true
				}
			})

			i++
		}

		if (this.bioLanguageDropdownOptions.length == 0) {
			this.bioMode = BioMode.None

			// Add default item
			this.bioLanguageDropdownOptions.push({
				key: 0,
				text: this.locale.addYourBio
			})

			i++

			// Add each supported language
			let languages = this.dataService.GetLocale().misc.languages
			for (let language of Object.keys(languages)) {
				this.bioLanguageDropdownOptions.push({
					key: i,
					text: languages[language],
					data: {
						language,
						added: false
					}
				})

				i++
			}
		} else {
			// Add a divider and all possible languages to add
			let newOptions: IDropdownOption[] = [{
				key: "header",
				text: this.locale.additionalLanguages,
				itemType: DropdownMenuItemType.Header
			}]

			let languages = this.dataService.GetLocale().misc.languages
			for (let language of Object.keys(languages)) {
				// Check if there is a bio with the supported language
				let index = this.bioLanguageDropdownOptions.findIndex(option => option.data.language == language)

				if (index == -1) {
					// There is no bio in that language
					// Add an option to add that language
					newOptions.push({
						key: i,
						text: languages[language],
						data: {
							language,
							added: false
						}
					})

					i++
				}
			}

			if (newOptions.length > 1) {
				for (let option of newOptions) {
					this.bioLanguageDropdownOptions.push(option)
				}
			}

			// Select and show the first language
			this.bioMode = BioMode.Normal
		}
	}

	async EditBio() {
		if (this.bioMode == BioMode.New || this.bioMode == BioMode.NormalEdit) {
			this.newBioError = ""
			this.bioLoading = true

			// Save the new bio on the server
			let selectedOption = this.bioLanguageDropdownOptions[this.bioLanguageDropdownSelectedIndex + (this.bioMode == BioMode.New && this.author.bios.length > 0 ? 1 : 0)]

			if (this.authorMode == AuthorMode.AuthorOfUser) {
				this.ProcessSetBioResponse(
					await this.apiService.SetBioOfAuthorOfUser({
						language: selectedOption.data.language,
						bio: this.newBio
					})
				)
			} else {
				this.ProcessSetBioResponse(
					await this.apiService.SetBioOfAuthor({
						uuid: this.uuid,
						language: selectedOption.data.language,
						bio: this.newBio
					})
				)
			}
		} else {
			this.newBio = this.author.bios[this.bioLanguageDropdownSelectedIndex].bio
			this.newBioError = ""
			this.bioMode = BioMode.NormalEdit
		}
	}

	CancelEditBio() {
		this.bioMode = 2
		this.newBio = ""
		this.newBioError = ""
	}

	BioLanguageDropdownChange(e: { event: MouseEvent, option: { key: number, text: string, data: any }, index: number }) {
		this.bioLanguageDropdownSelectedIndex = e.option.key
		this.newBioError = ""

		if (!e.option.data) {
			this.bioMode = BioMode.None
		} else {
			this.bioMode = e.option.data.added ? BioMode.Normal : BioMode.New
		}
	}

	async UploadProfileImage(file: ReadFile) {
		this.profileImageLoading = true

		// Get the content of the image file
		let readPromise: Promise<ArrayBuffer> = new Promise((resolve) => {
			let reader = new FileReader();
			reader.addEventListener('loadend', () => {
				resolve(reader.result as ArrayBuffer)
			})
			reader.readAsArrayBuffer(new Blob([file.underlyingFile]))
		})

		let imageContent = await readPromise
		this.profileImageContent = file.content

		// Upload the image
		let response: ApiResponse<any>

		if (this.authorMode == AuthorMode.AuthorOfUser) {
			response = await this.apiService.SetProfileImageOfAuthorOfUser({
				type: file.type,
				file: imageContent
			})
		} else {
			response = await this.apiService.SetProfileImageOfAuthor({
				uuid: this.uuid,
				type: file.type,
				file: imageContent
			})
		}

		this.profileImageLoading = false

		if (response.status == 200) {
			// Show the uploaded profile image
			this.author.profileImage = true
		}
	}

	ShowEditProfileDialog() {
		this.editProfileDialogFirstName = this.author.firstName
		this.editProfileDialogFirstNameError = ""
		this.editProfileDialogLastName = this.author.lastName
		this.editProfileDialogLastNameError = ""
		this.editProfileDialogWebsiteUrl = this.author.websiteUrl
		this.editProfileDialogWebsiteUrlError = ""
		this.editProfileDialogFacebookUsername = this.author.facebookUsername
		this.editProfileDialogFacebookUsernameError = ""
		this.editProfileDialogInstagramUsername = this.author.instagramUsername
		this.editProfileDialogInstagramUsernameError = ""
		this.editProfileDialogTwitterUsername = this.author.twitterUsername
		this.editProfileDialogTwitterUsernameError = ""

		this.editProfileDialogContentProps.title = this.locale.editProfileDialog.title
		this.editProfileDialogVisible = true

		if (this.dualScreenLayout) {
			UpdateDialogForDualScreenLayout()
		}
	}

	NavigateToNewBookPage() {
		let extras: NavigationExtras = {}

		if (this.dataService.userIsAdmin) {
			extras.queryParams = {
				author: this.author.uuid
			}
		}

		this.router.navigate(["author", "book", "new"], extras)
	}

	async SaveProfile() {
		this.editProfileDialogFirstNameError = ""
		this.editProfileDialogLastNameError = ""
		this.editProfileDialogWebsiteUrlError = ""
		this.editProfileDialogFacebookUsernameError = ""
		this.editProfileDialogInstagramUsernameError = ""
		this.editProfileDialogTwitterUsernameError = ""

		let response: ApiResponse<any>
		if (this.dataService.userIsAdmin) {
			response = await this.apiService.UpdateAuthor({
				uuid: this.author.uuid,
				firstName: this.editProfileDialogFirstName,
				lastName: this.editProfileDialogLastName,
				websiteUrl: this.editProfileDialogWebsiteUrl,
				facebookUsername: this.editProfileDialogFacebookUsername,
				instagramUsername: this.editProfileDialogInstagramUsername,
				twitterUsername: this.editProfileDialogTwitterUsername
			})
		} else {
			response = await this.apiService.UpdateAuthorOfUser({
				firstName: this.editProfileDialogFirstName,
				lastName: this.editProfileDialogLastName,
				websiteUrl: this.editProfileDialogWebsiteUrl,
				facebookUsername: this.editProfileDialogFacebookUsername,
				instagramUsername: this.editProfileDialogInstagramUsername,
				twitterUsername: this.editProfileDialogTwitterUsername
			})
		}

		if (response.status == 200) {
			// Close the dialog and update the values in the appropriate author
			this.editProfileDialogVisible = false

			if (this.dataService.userIsAdmin) {
				let i = this.dataService.adminAuthors.findIndex(author => author.uuid == response.data.uuid)
				if (i == -1) return

				this.dataService.adminAuthors[i].firstName = response.data.first_name
				this.dataService.adminAuthors[i].lastName = response.data.last_name
				this.dataService.adminAuthors[i].websiteUrl = response.data.website_url
				this.dataService.adminAuthors[i].facebookUsername = response.data.facebook_username
				this.dataService.adminAuthors[i].instagramUsername = response.data.instagram_username
				this.dataService.adminAuthors[i].twitterUsername = response.data.twitter_username
			} else {
				this.dataService.userAuthor.firstName = response.data.first_name
				this.dataService.userAuthor.lastName = response.data.last_name
				this.dataService.userAuthor.websiteUrl = response.data.website_url
				this.dataService.userAuthor.facebookUsername = response.data.facebook_username
				this.dataService.userAuthor.instagramUsername = response.data.instagram_username
				this.dataService.userAuthor.twitterUsername = response.data.twitter_username
			}

			this.UpdateSocialMediaLinks()
		} else {
			for (let error of response.data.errors) {
				switch (error.code) {
					case ErrorCodes.FirstNameTooShort:
						if (this.editProfileDialogFirstName.length == 0) {
							this.editProfileDialogFirstNameError = this.locale.editProfileDialog.errors.firstNameMissing
						} else {
							this.editProfileDialogFirstNameError = this.locale.editProfileDialog.errors.firstNameTooShort
						}
						break
					case ErrorCodes.LastNameTooShort:
						if (this.editProfileDialogLastName.length == 0) {
							this.editProfileDialogLastNameError = this.locale.editProfileDialog.errors.lastNameMissing
						} else {
							this.editProfileDialogLastNameError = this.locale.editProfileDialog.errors.lastNameTooShort
						}
						break
					case ErrorCodes.FirstNameTooLong:
						this.editProfileDialogFirstNameError = this.locale.editProfileDialog.errors.firstNameTooLong
						break
					case ErrorCodes.LastNameTooLong:
						this.editProfileDialogLastNameError = this.locale.editProfileDialog.errors.lastNameTooLong
						break
					case ErrorCodes.WebsiteUrlInvalid:
						this.editProfileDialogWebsiteUrlError = this.locale.editProfileDialog.errors.websiteUrlInvalid
						break
					case ErrorCodes.FacebookUsernameInvalid:
						this.editProfileDialogFacebookUsernameError = this.locale.editProfileDialog.errors.usernameInvalid
						break
					case ErrorCodes.InstagramUsernameInvalid:
						this.editProfileDialogInstagramUsernameError = this.locale.editProfileDialog.errors.usernameInvalid
						break
					case ErrorCodes.TwitterUsernameInvalid:
						this.editProfileDialogTwitterUsernameError = this.locale.editProfileDialog.errors.usernameInvalid
						break
				}
			}
		}
	}

	ProcessSetBioResponse(response: ApiResponse<any>) {
		if (response.status == 200) {
			if (this.bioMode == BioMode.New) {
				// Add the new bio to the bios
				this.author.bios.push(response.data)

				// Update the dropdown
				this.bioMode = BioMode.Normal
				this.newBio = ""
				this.newBioError = ""
				this.SetupBioLanguageDropdown()

				// Show the bio in the language that was just added
				let i = this.bioLanguageDropdownOptions.findIndex(option => option.data.language == response.data.language)
				if (i != -1) {
					this.bioLanguageDropdownSelectedIndex = this.bioLanguageDropdownOptions[i].key as number
				}
			} else {
				// Find and update the edited bio
				let i = this.author.bios.findIndex(bio => bio.language == response.data.language)
				if (i != -1) {
					this.author.bios[i].bio = response.data.bio
				}

				this.newBio = ""
				this.newBioError = ""
				this.bioMode = BioMode.Normal
			}
		} else {
			let errorCode = response.data.errors[0].code

			switch (errorCode) {
				case ErrorCodes.BioTooShort:
					this.newBioError = this.locale.errors.bioTooShort
					break
				case ErrorCodes.BioTooLong:
					this.newBioError = this.locale.errors.bioTooLong
					break
				default:
					this.newBioError = this.locale.errors.unexpectedError
					break
			}
		}

		this.bioLoading = false
	}

	async LoadAuthor() {
		let response: ApiResponse<any> = await this.apiService.GetAuthor({
			uuid: this.uuid,
			books: true,
			languages: await this.dataService.GetStoreLanguages()
		})

		if (response.status == 200) {
			this.author = {
				uuid: response.data.uuid,
				firstName: response.data.first_name,
				lastName: response.data.last_name,
				websiteUrl: response.data.website_url,
				facebookUsername: response.data.facebook_username,
				instagramUsername: response.data.instagram_username,
				twitterUsername: response.data.twitter_username,
				bios: response.data.bios,
				collections: [],
				profileImage: response.data.profile_image,
				profileImageBlurhash: response.data.profile_image_blurhash
			}

			for (let book of response.data.books) {
				let bookItem: BookListItem = {
					uuid: book.uuid,
					title: book.title,
					cover: book.cover,
					coverContent: null,
					coverBlurhash: null
				}

				if (bookItem.cover) {
					bookItem.coverBlurhash = book.cover_blurhash

					this.apiService.GetStoreBookCover({ uuid: book.uuid }).then((result: ApiResponse<string>) => {
						bookItem.coverContent = result.data
					})
				}

				this.books.push(bookItem)
			}

			this.bioMode = BioMode.Normal
			this.UpdateSocialMediaLinks()
			this.SelectDefaultBio()
		}
	}

	UpdateSocialMediaLinks() {
		this.facebookLink = this.GenerateFacebookLink(this.author.facebookUsername)
		this.instagramLink = this.GenerateInstagramLink(this.author.instagramUsername)
		this.twitterLink = this.GenerateTwitterLink(this.author.twitterUsername)
	}

	GenerateFacebookLink(facebookUsername: string): string {
		if (!facebookUsername) return ""
		return `https://facebook.com/${facebookUsername}`
	}

	GenerateInstagramLink(instagramUsername: string): string {
		if (!instagramUsername) return ""
		return `https://instagram.com/${instagramUsername}`
	}

	GenerateTwitterLink(twitterUsername: string): string {
		if (!twitterUsername) return ""
		return `https://twitter.com/${twitterUsername}`
	}
}

enum BioMode {
	None = 0,		// If the author has no bios and has not selected to add a bio, show nothing
	New = 1,			// If the author has selected a language to add, show the input for creating a bio
	Normal = 2,		// If the author has one or more bios, show the selected bio
	NormalEdit = 3	// If the author has one or more bios and the user is editing the bio of the selected language
}