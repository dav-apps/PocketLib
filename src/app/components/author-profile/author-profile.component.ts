import {
	Component,
	Input,
	Output,
	EventEmitter,
	HostListener,
	ViewChild,
	ElementRef
} from '@angular/core'
import { ReadFile } from 'ngx-file-helpers'
import { faGlobe } from '@fortawesome/free-solid-svg-icons'
import { faFacebook, faInstagram, faTwitter } from '@fortawesome/free-brands-svg-icons'
import Cropper from 'cropperjs'
import { Dav, ApiResponse, ApiErrorResponse, isSuccessStatusCode } from 'dav-js'
import { DropdownOption, DropdownOptionType } from 'dav-ui-components'
import { DataService } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { CachingService } from 'src/app/services/caching-service'
import { Author } from 'src/app/models/Author'
import { GetDualScreenSettings, GetLanguageByString } from 'src/app/misc/utils'
import {
	BookListItem,
	AuthorMode,
	AuthorResource,
	AuthorField,
	AuthorBioField,
	AuthorBioResource,
	ListResponseData,
	StoreBookResource,
	StoreBookListField,
	StoreBookReleaseResource,
	StoreBookItem
} from 'src/app/misc/types'
import * as ErrorCodes from 'src/constants/errorCodes'
import { enUS } from 'src/locales/locales'

interface CollectionItem {
	uuid: string
	name: string
	link: string
	books: StoreBookItem[]
}

interface SeriesItem {
	uuid: string
	name: string
	link: string
	books: StoreBookItem[]
}

enum BioMode {
	None = 0,		// If the author has no bios and has not selected to add a bio, show nothing
	New = 1,			// If the author has selected a language to add, show the input for creating a bio
	Normal = 2,		// If the author has one or more bios, show the selected bio
	NormalEdit = 3	// If the author has one or more bios and the user is editing the bio of the selected language
}

const maxProfileImageFileSize = 2000000

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
	collectionsLoaded: boolean = false
	seriesLoaded: boolean = false
	width: number = 500
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	storeContext: boolean = true		// Whether the component is shown in the Store
	authorMode: AuthorMode = AuthorMode.Normal
	author: Author = new Author(null, [], this.apiService, this.cachingService)
	facebookLink: string = ""
	instagramLink: string = ""
	twitterLink: string = ""
	bios: { language: string, value: string }[] = []
	books: BookListItem[] = []
	profileImageWidth: number = 200
	bioLanguageDropdownOptions: DropdownOption[] = []
	bioLanguageDropdownSelectedKey: string = "en"
	bioMode: BioMode = BioMode.None
	currentBio: string = ""
	newBio: string = ""
	newBioError: string = ""
	bioLoading: boolean = false
	collections: CollectionItem[] = []
	series: SeriesItem[] = []
	profileImageLoading: boolean = false
	profileImageContent: string = this.dataService.defaultProfileImageUrl
	profileImageAlt: string = ""
	bookTitleFontSize: number = 20
	errorMessage: string = ""
	providerMessage: string = ""
	newBookPageLink: {
		path: string,
		params: any
	} = { path: "/author/book/new", params: {} }
	newSeriesPageLink: {
		path: string,
		params: any
	} = { path: "/author/series/new", params: {} }

	//#region ProfileImageDialog
	@ViewChild('profileImageDialogImage', { static: true }) profileImageDialogImage: ElementRef<HTMLImageElement>
	profileImageDialogVisible: boolean = false
	profileImageCropper: Cropper
	//#endregion

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

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private cachingService: CachingService
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

		if (this.dataService.userIsAdmin) {
			this.authorMode = AuthorMode.AuthorOfAdmin
			
			// Get the author from the admin authors
			this.author = this.dataService.adminAuthors.find(author => author.uuid == this.uuid)
			this.UpdateSocialMediaLinks()
			await this.LoadBios()
			await this.SelectDefaultBio()
		} else if (this.dataService.userAuthor) {
			this.authorMode = AuthorMode.AuthorOfUser

			this.author = this.dataService.userAuthor
			this.UpdateSocialMediaLinks()
			await this.LoadBios()
			await this.SelectDefaultBio()

			// Set the text and visibility for the provider message
			this.providerMessage = this.locale.messages.providerMessage.replace('{0}', Dav.GetUserPageLink('provider'))
		} else {
			// Get the author from the server
			await this.LoadAuthor()
		}

		if (this.author.profileImage.url != null) {
			// Load the author profile image
			this.apiService.GetFile({ url: this.author.profileImage.url }).then((fileResponse: ApiResponse<string> | ApiErrorResponse) => {
				if (isSuccessStatusCode(fileResponse.status)) {
					this.profileImageContent = (fileResponse as ApiResponse<string>).data
				}
			})
		}

		// Set the new book page link
		if (this.dataService.userIsAdmin) {
			this.newBookPageLink.path = `/author/${this.author.uuid}/book/new`
			this.newSeriesPageLink.path = `/author/${this.author.uuid}/series/new`
		}

		this.SetupBioLanguageDropdown()
		this.profileImageAlt = this.dataService.GetLocale().misc.authorProfileImageAlt.replace('{0}', `${this.author.firstName} ${this.author.lastName}`)

		await this.LoadCollections()
		await this.LoadSeries()
		this.loaded.emit()
	}

	@HostListener('window:resize')
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

	async LoadCollections() {
		if (this.authorMode == AuthorMode.Normal) return

		for (let collection of await this.author.GetCollections()) {
			let collectionItem: CollectionItem = {
				uuid: collection.uuid,
				name: collection.name.value,
				link: "",
				books: []
			}

			for (let book of await collection.GetStoreBooks()) {
				let bookItem: StoreBookItem = {
					uuid: book.uuid,
					title: book.title,
					description: book.description,
					language: book.language,
					status: book.status,
					coverContent: null,
					coverBlurhash: book.cover.blurhash
				}

				book.GetCoverContent().then(result => bookItem.coverContent = result)
				collectionItem.books.push(bookItem)
			}

			// Set the correct link for the collection item
			if (collectionItem.books.length == 1) {
				let book = collectionItem.books[0]
				let releasesResponse = await this.apiService.ListStoreBookReleases({ storeBook: book.uuid })
				let releases = []

				if (isSuccessStatusCode(releasesResponse.status)) {
					releases = (releasesResponse as ApiResponse<ListResponseData<StoreBookReleaseResource>>).data.items
				}

				if (this.authorMode == AuthorMode.AuthorOfAdmin) {
					if (releases.length > 1) {
						collectionItem.link = `/author/${this.author.uuid}/book/${collectionItem.books[0].uuid}/releases`
					} else {
						collectionItem.link = `/author/${this.author.uuid}/book/${collectionItem.books[0].uuid}`
					}
				} else {
					if (releases.length > 1) {
						collectionItem.link = `/author/book/${collectionItem.books[0].uuid}/releases`
					} else {
						collectionItem.link = `/author/book/${collectionItem.books[0].uuid}`
					}
				}
			} else {
				if (this.authorMode == AuthorMode.AuthorOfAdmin) {
					collectionItem.link = `/author/${this.author.uuid}/collection/${collectionItem.uuid}`
				} else {
					collectionItem.link = `/author/collection/${collectionItem.uuid}`
				}
			}

			this.collections.push(collectionItem)
		}

		this.collectionsLoaded = true
	}

	async LoadSeries() {
		if (this.authorMode == AuthorMode.Normal) return

		for (let series of await this.author.GetSeries()) {
			let seriesItem: SeriesItem = {
				uuid: series.uuid,
				name: series.name,
				link: "",
				books: []
			}

			for (let book of await series.GetStoreBooks()) {
				let bookItem: StoreBookItem = {
					uuid: book.uuid,
					title: book.title,
					description: book.description,
					language: book.language,
					status: book.status,
					coverContent: await book.GetCoverContent(),
					coverBlurhash: book.cover?.blurhash
				}

				seriesItem.books.push(bookItem)
			}

			if (this.authorMode == AuthorMode.AuthorOfAdmin) {
				seriesItem.link = `/author/${this.author.uuid}/series/${seriesItem.uuid}`
			} else {
				seriesItem.link = `/author/series/${seriesItem.uuid}`
			}

			this.series.push(seriesItem)
		}

		this.seriesLoaded = true
	}

	async LoadBios() {
		this.bios = []

		for (let bio of await this.author.GetBios()) {
			this.bios.push({
				language: bio.language,
				value: bio.bio
			})
		}
	}

	async SelectDefaultBio() {
		let i = this.bios.findIndex(bio => bio.language == this.dataService.supportedLocale)

		if (i != -1) {
			this.bioLanguageDropdownSelectedKey = this.dataService.supportedLocale
		} else if (this.bios.length > 0) {
			this.bioLanguageDropdownSelectedKey = this.bios[0].language
		} else {
			this.bioLanguageDropdownSelectedKey = "default"
		}

		this.UpdateCurrentBio()
	}

	async UpdateCurrentBio() {
		let i = this.bios.findIndex(bio => bio.language == this.bioLanguageDropdownSelectedKey)

		if (i == -1) {
			this.currentBio = ""
		} else {
			this.currentBio = this.bios[i].value
		}
	}

	async SetupBioLanguageDropdown() {
		if (this.authorMode == AuthorMode.Normal) return

		// Prepare the Bio language dropdown
		this.bioLanguageDropdownOptions = []

		for (let bio of this.bios) {
			this.bioLanguageDropdownOptions.push({
				key: bio.language,
				value: this.dataService.GetFullLanguage(GetLanguageByString(bio.language)),
				type: DropdownOptionType.option
			})
		}

		if (this.bioLanguageDropdownOptions.length == 0) {
			this.bioMode = BioMode.None

			// Add default item
			this.bioLanguageDropdownOptions.push({
				key: "default",
				value: this.locale.addYourBio,
				type: DropdownOptionType.option
			})

			// Add each supported language
			let languages = this.dataService.GetLocale().misc.languages
			for (let language of Object.keys(languages)) {
				this.bioLanguageDropdownOptions.push({
					key: language,
					value: languages[language],
					type: DropdownOptionType.option
				})
			}
		} else {
			// Add a divider and all possible languages to add
			let newOptions: DropdownOption[] = [{
				key: "divider",
				value: null,
				type: DropdownOptionType.divider
			}]

			let languages = this.dataService.GetLocale().misc.languages
			for (let language of Object.keys(languages)) {
				// Check if there is a bio with the supported language
				let index = this.bioLanguageDropdownOptions.findIndex(option => option.key == language)

				if (index == -1) {
					// There is no bio in that language
					// Add an option to add that language
					newOptions.push({
						key: language,
						value: languages[language],
						type: DropdownOptionType.option
					})
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
			if (this.authorMode == AuthorMode.AuthorOfUser) {
				await this.ProcessSetBioResponse(
					await this.apiService.SetAuthorBio({
						fields: [AuthorBioField.bio, AuthorBioField.language],
						uuid: "mine",
						language: this.bioLanguageDropdownSelectedKey,
						bio: this.newBio
					})
				)
			} else {
				await this.ProcessSetBioResponse(
					await this.apiService.SetAuthorBio({
						fields: [AuthorBioField.bio, AuthorBioField.language],
						uuid: this.uuid,
						language: this.bioLanguageDropdownSelectedKey,
						bio: this.newBio
					})
				)
			}
		} else {
			this.newBio = this.currentBio
			this.newBioError = ""
			this.bioMode = BioMode.NormalEdit
		}
	}

	CancelEditBio() {
		this.bioMode = BioMode.Normal
		this.newBio = ""
		this.newBioError = ""
	}

	async BioLanguageDropdownChange(event: CustomEvent) {
		this.bioLanguageDropdownSelectedKey = event.detail.key
		this.newBioError = ""

		if (this.bioLanguageDropdownSelectedKey == "default") {
			this.bioMode = BioMode.None
		} else {
			let i = this.bios.findIndex(bio => bio.language == this.bioLanguageDropdownSelectedKey)

			if (i == -1) {
				this.bioMode = BioMode.New
			} else {
				this.bioMode = BioMode.Normal
			}
		}

		this.UpdateCurrentBio()
	}

	async ProfileImageFileSelected(file: ReadFile) {
		this.errorMessage = ""
		this.profileImageDialogVisible = true

		this.profileImageDialogImage.nativeElement.onload = () => {
			this.profileImageCropper = new Cropper(this.profileImageDialogImage.nativeElement, {
				aspectRatio: 1,
				autoCropArea: 1,
				viewMode: 2
			})
		}

		this.profileImageDialogImage.nativeElement.src = file.content
	}

	async UploadProfileImage() {
		this.profileImageDialogVisible = false
		let oldProfileImageContent = this.profileImageContent

		let canvas = this.profileImageCropper.getCroppedCanvas()
		let blob = await new Promise<Blob>((r: Function) =>
			canvas.toBlob((blob: Blob) => r(blob), "image/jpeg", 0.5)
		)
		this.profileImageCropper.destroy()

		if (blob.size > maxProfileImageFileSize) {
			this.errorMessage = this.locale.errors.profileImageFileTooLarge
			return
		}

		this.profileImageLoading = true
		this.profileImageContent = canvas.toDataURL("image/png")

		// Send the file content to the server
		let response: ApiResponse<any> | ApiErrorResponse

		if (this.authorMode == AuthorMode.AuthorOfUser) {
			response = await this.apiService.UploadAuthorProfileImage({
				uuid: "mine",
				type: blob.type,
				file: blob
			})
		} else {
			response = await this.apiService.UploadAuthorProfileImage({
				uuid: this.uuid,
				type: blob.type,
				file: blob
			})
		}

		if (isSuccessStatusCode(response.status)) {
			await this.author.ReloadProfileImage()
		} else {
			// Show the old profile image
			this.profileImageContent = oldProfileImageContent
			// TODO: Show error message
		}

		this.profileImageLoading = false
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
		this.editProfileDialogVisible = true
	}

	async SaveProfile() {
		this.editProfileDialogFirstNameError = ""
		this.editProfileDialogLastNameError = ""
		this.editProfileDialogWebsiteUrlError = ""
		this.editProfileDialogFacebookUsernameError = ""
		this.editProfileDialogInstagramUsernameError = ""
		this.editProfileDialogTwitterUsernameError = ""

		let response: ApiResponse<AuthorResource> | ApiErrorResponse

		if (this.dataService.userIsAdmin) {
			response = await this.apiService.UpdateAuthor({
				fields: [
					AuthorField.uuid,
					AuthorField.firstName,
					AuthorField.lastName,
					AuthorField.websiteUrl,
					AuthorField.facebookUsername,
					AuthorField.instagramUsername,
					AuthorField.twitterUsername
				],
				uuid: this.author.uuid,
				firstName: this.editProfileDialogFirstName,
				lastName: this.editProfileDialogLastName,
				websiteUrl: this.editProfileDialogWebsiteUrl,
				facebookUsername: this.editProfileDialogFacebookUsername,
				instagramUsername: this.editProfileDialogInstagramUsername,
				twitterUsername: this.editProfileDialogTwitterUsername
			})
		} else {
			response = await this.apiService.UpdateAuthor({
				fields: [
					AuthorField.uuid,
					AuthorField.firstName,
					AuthorField.lastName,
					AuthorField.websiteUrl,
					AuthorField.facebookUsername,
					AuthorField.instagramUsername,
					AuthorField.twitterUsername
				],
				uuid: "mine",
				firstName: this.editProfileDialogFirstName,
				lastName: this.editProfileDialogLastName,
				websiteUrl: this.editProfileDialogWebsiteUrl,
				facebookUsername: this.editProfileDialogFacebookUsername,
				instagramUsername: this.editProfileDialogInstagramUsername,
				twitterUsername: this.editProfileDialogTwitterUsername
			})
		}

		if (isSuccessStatusCode(response.status)) {
			let responseData = (response as ApiResponse<AuthorResource>).data

			// Close the dialog and update the values in the appropriate author
			this.editProfileDialogVisible = false

			if (this.dataService.userIsAdmin) {
				let i = this.dataService.adminAuthors.findIndex(author => author.uuid == responseData.uuid)
				if (i == -1) return

				this.dataService.adminAuthors[i].firstName = responseData.firstName
				this.dataService.adminAuthors[i].lastName = responseData.lastName
				this.dataService.adminAuthors[i].websiteUrl = responseData.websiteUrl
				this.dataService.adminAuthors[i].facebookUsername = responseData.facebookUsername
				this.dataService.adminAuthors[i].instagramUsername = responseData.instagramUsername
				this.dataService.adminAuthors[i].twitterUsername = responseData.twitterUsername
			} else {
				this.dataService.userAuthor.firstName = responseData.firstName
				this.dataService.userAuthor.lastName = responseData.lastName
				this.dataService.userAuthor.websiteUrl = responseData.websiteUrl
				this.dataService.userAuthor.facebookUsername = responseData.facebookUsername
				this.dataService.userAuthor.instagramUsername = responseData.instagramUsername
				this.dataService.userAuthor.twitterUsername = responseData.twitterUsername
			}

			this.UpdateSocialMediaLinks()
		} else {
			for (let error of (response as ApiErrorResponse).errors) {
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

	async ProcessSetBioResponse(response: ApiResponse<AuthorBioResource> | ApiErrorResponse) {
		if (isSuccessStatusCode(response.status)) {
			this.author.ClearBios()
			await this.LoadBios()

			this.newBio = ""
			this.newBioError = ""
			this.bioMode = BioMode.Normal

			this.SetupBioLanguageDropdown()
			this.UpdateCurrentBio()
		} else {
			let errorCode = (response as ApiErrorResponse).errors[0].code

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
		let response = await this.apiService.RetrieveAuthor({
			uuid: this.uuid,
			fields: [
				AuthorField.uuid,
				AuthorField.firstName,
				AuthorField.lastName,
				AuthorField.websiteUrl,
				AuthorField.facebookUsername,
				AuthorField.instagramUsername,
				AuthorField.twitterUsername,
				AuthorField.profileImage
			],
			languages: await this.dataService.GetStoreLanguages()
		})

		if (isSuccessStatusCode(response.status)) {
			let responseData = (response as ApiResponse<AuthorResource>).data
			this.author = new Author(
				responseData,
				await this.dataService.GetStoreLanguages(),
				this.apiService,
				this.cachingService
			)

			// Get the store books of the author
			let storeBooksResponse = await this.apiService.ListStoreBooks({
				fields: [
					StoreBookListField.items_uuid,
					StoreBookListField.items_title,
					StoreBookListField.items_cover
				],
				languages: await this.dataService.GetStoreLanguages(),
				author: responseData.uuid
			})

			if (isSuccessStatusCode(storeBooksResponse.status)) {
				let storeBooksResponseData = (storeBooksResponse as ApiResponse<ListResponseData<StoreBookResource>>).data

				for (let storeBook of storeBooksResponseData.items) {
					let bookItem: BookListItem = {
						uuid: storeBook.uuid,
						title: storeBook.title,
						coverContent: null,
						coverBlurhash: storeBook.cover?.blurhash
					}

					if (storeBook.cover?.url != null) {
						this.apiService.GetFile({ url: storeBook.cover.url }).then((fileResponse: ApiResponse<string> | ApiErrorResponse) => {
							if (isSuccessStatusCode(fileResponse.status)) {
								bookItem.coverContent = (fileResponse as ApiResponse<string>).data
							}
						})
					}

					this.books.push(bookItem)
				}
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