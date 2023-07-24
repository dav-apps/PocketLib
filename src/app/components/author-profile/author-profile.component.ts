import {
	Component,
	Input,
	Output,
	EventEmitter,
	HostListener,
	ViewChild,
	ElementRef
} from "@angular/core"
import { Router } from "@angular/router"
import { ReadFile } from "ngx-file-helpers"
import {
	faPen as faPenLight,
	faGlobe as faGlobeLight
} from "@fortawesome/pro-light-svg-icons"
import {
	faFacebook,
	faInstagram,
	faTwitter
} from "@fortawesome/free-brands-svg-icons"
import Cropper from "cropperjs"
import { Dav, ApiResponse, ApiErrorResponse, isSuccessStatusCode } from "dav-js"
import { DropdownOption, DropdownOptionType } from "dav-ui-components"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { GraphQLService } from "src/app/services/graphql-service"
import { Author } from "src/app/models/Author"
import {
	GetDualScreenSettings,
	GetLanguageByString,
	GenerateFacebookLink,
	GenerateInstagramLink,
	GenerateTwitterLink
} from "src/app/misc/utils"
import {
	UpdateResponse,
	BookListItem,
	AuthorMode,
	AuthorBioResource2,
	StoreBookItem,
	StoreBookStatus,
	AuthorProfileImageResource
} from "src/app/misc/types"
import * as ErrorCodes from "src/constants/errorCodes"
import { enUS } from "src/locales/locales"

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
	None = 0, // If the author has no bios and has not selected to add a bio, show nothing
	New = 1, // If the author has selected a language to add, show the input for creating a bio
	Normal = 2, // If the author has one or more bios, show the selected bio
	NormalEdit = 3 // If the author has one or more bios and the user is editing the bio of the selected language
}

const maxProfileImageFileSize = 2000000

@Component({
	selector: "pocketlib-author-profile",
	templateUrl: "./author-profile.component.html",
	styleUrls: ["./author-profile.component.scss"]
})
export class AuthorProfileComponent {
	locale = enUS.authorProfile
	faPenLight = faPenLight
	faGlobeLight = faGlobeLight
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
	storeContext: boolean = true // Whether the component is shown in the Store
	authorMode: AuthorMode = AuthorMode.Normal
	author: Author = new Author(null, [], this.graphqlService)
	facebookLink: string = ""
	instagramLink: string = ""
	twitterLink: string = ""
	bios: { language: string; value: string }[] = []
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

	//#region ProfileImageDialog
	@ViewChild("profileImageDialogImage", { static: true })
	profileImageDialogImage: ElementRef<HTMLImageElement>
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
		private graphqlService: GraphQLService,
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

		let author = null

		if (this.dataService.userIsAdmin) {
			this.authorMode = AuthorMode.AuthorOfAdmin
			author = this.dataService.adminAuthors.find(
				author => author.uuid == this.uuid
			)

			if (author == null) {
				for (let publisher of this.dataService.adminPublishers) {
					author = (await publisher.GetAuthors()).find(
						a => a.uuid == this.uuid
					)
					if (author != null) break
				}
			}

			if (author != null) {
				this.author = author
				await this.LoadBios()
				await this.SelectDefaultBio()
			}
		} else if (this.dataService.userAuthor) {
			this.authorMode = AuthorMode.AuthorOfUser
			author = this.dataService.userAuthor

			if (this.author != null) {
				this.author = author
				await this.LoadBios()
				await this.SelectDefaultBio()

				// Set the text and visibility for the provider message
				this.providerMessage = this.locale.messages.providerMessage.replace(
					"{0}",
					Dav.GetUserPageLink("provider")
				)
			}
		}

		if (author == null && this.storeContext) {
			this.authorMode = AuthorMode.Normal

			// Get the author from the server
			await this.LoadAuthor()
		} else if (author == null) {
			return
		}

		this.UpdateSocialMediaLinks()

		if (this.author.profileImage?.url != null) {
			// Load the author profile image
			this.graphqlService
				.GetFile({ url: this.author.profileImage.url })
				.then((fileResponse: ApiResponse<string> | ApiErrorResponse) => {
					if (isSuccessStatusCode(fileResponse.status)) {
						this.profileImageContent = (
							fileResponse as ApiResponse<string>
						).data
					}
				})
		}

		this.SetupBioLanguageDropdown()
		this.profileImageAlt = this.dataService
			.GetLocale()
			.misc.authorProfileImageAlt.replace(
				"{0}",
				`${this.author.firstName} ${this.author.lastName}`
			)

		await this.LoadCollections()
		await this.LoadSeries()
		this.loaded.emit()
	}

	@HostListener("window:resize")
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

				book
					.GetCoverContent()
					.then(result => (bookItem.coverContent = result))
				collectionItem.books.push(bookItem)
			}

			// Set the correct link for the collection item
			if (collectionItem.books.length == 1) {
				let book = collectionItem.books[0]

				if (this.authorMode == AuthorMode.AuthorOfAdmin) {
					collectionItem.link = `/author/${this.author.uuid}/book/${book.uuid}`
				} else {
					collectionItem.link = `/author/book/${book.uuid}`
				}

				if (book.status == StoreBookStatus.Unpublished) {
					collectionItem.link += "/details"
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
		let i = this.bios.findIndex(
			bio => bio.language == this.dataService.supportedLocale
		)

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
		let i = this.bios.findIndex(
			bio => bio.language == this.bioLanguageDropdownSelectedKey
		)

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
				value: this.dataService.GetFullLanguage(
					GetLanguageByString(bio.language)
				),
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
			let newOptions: DropdownOption[] = [
				{
					key: "divider",
					value: null,
					type: DropdownOptionType.divider
				}
			]

			let languages = this.dataService.GetLocale().misc.languages
			for (let language of Object.keys(languages)) {
				// Check if there is a bio with the supported language
				let index = this.bioLanguageDropdownOptions.findIndex(
					option => option.key == language
				)

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
				let response = await this.graphqlService.setAuthorBio(
					`
						success
						errors
					`,
					{
						uuid: "mine",
						language: this.bioLanguageDropdownSelectedKey,
						bio: this.newBio
					}
				)

				await this.ProcessSetBioResponse(response.data.setAuthorBio)
			} else {
				let response = await this.graphqlService.setAuthorBio(
					`
						success
						errors
					`,
					{
						uuid: this.uuid,
						language: this.bioLanguageDropdownSelectedKey,
						bio: this.newBio
					}
				)

				await this.ProcessSetBioResponse(response.data.setAuthorBio)
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
			let i = this.bios.findIndex(
				bio => bio.language == this.bioLanguageDropdownSelectedKey
			)

			if (i == -1) {
				this.bioMode = BioMode.New
			} else {
				this.bioMode = BioMode.Normal
			}
		}

		this.UpdateCurrentBio()
	}

	NavigateToNewBookPage() {
		this.router.navigate(["author", this.author.uuid, "book", "new"])
	}

	NavigateToNewSeriesPage() {
		this.router.navigate(["author", this.author.uuid, "series", "new"])
	}

	async ProfileImageFileSelected(file: ReadFile) {
		this.errorMessage = ""
		this.profileImageDialogVisible = true

		this.profileImageDialogImage.nativeElement.onload = () => {
			this.profileImageCropper = new Cropper(
				this.profileImageDialogImage.nativeElement,
				{
					aspectRatio: 1,
					autoCropArea: 1,
					viewMode: 2
				}
			)
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
		let response: ApiResponse<AuthorProfileImageResource> | ApiErrorResponse

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
			this.errorMessage = this.locale.errors.profileImageUploadFailed
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

		let response = await this.graphqlService.updateAuthor(
			`
				firstName
				lastName
				websiteUrl
				facebookUsername
				instagramUsername
				twitterUsername
			`,
			{
				uuid: this.dataService.userIsAdmin ? this.author.uuid : "mine",
				firstName: this.editProfileDialogFirstName,
				lastName: this.editProfileDialogLastName,
				websiteUrl: this.editProfileDialogWebsiteUrl,
				facebookUsername: this.editProfileDialogFacebookUsername,
				instagramUsername: this.editProfileDialogInstagramUsername,
				twitterUsername: this.editProfileDialogTwitterUsername
			}
		)

		if (response.errors == null) {
			let responseData = response.data.updateAuthor
			this.editProfileDialogVisible = false

			this.author.firstName = responseData.firstName
			this.author.lastName = responseData.lastName
			this.author.websiteUrl = responseData.websiteUrl
			this.author.facebookUsername = responseData.facebookUsername
			this.author.instagramUsername = responseData.instagramUsername
			this.author.twitterUsername = responseData.twitterUsername

			this.UpdateSocialMediaLinks()
		} else {
			let errors = response.errors[0].extensions.errors as string[]

			for (let errorCode of errors) {
				switch (errorCode) {
					case ErrorCodes.FirstNameTooShort:
						if (this.editProfileDialogFirstName.length == 0) {
							this.editProfileDialogFirstNameError =
								this.locale.editProfileDialog.errors.firstNameMissing
						} else {
							this.editProfileDialogFirstNameError =
								this.locale.editProfileDialog.errors.firstNameTooShort
						}
						break
					case ErrorCodes.LastNameTooShort:
						if (this.editProfileDialogLastName.length == 0) {
							this.editProfileDialogLastNameError =
								this.locale.editProfileDialog.errors.lastNameMissing
						} else {
							this.editProfileDialogLastNameError =
								this.locale.editProfileDialog.errors.lastNameTooShort
						}
						break
					case ErrorCodes.FirstNameTooLong:
						this.editProfileDialogFirstNameError =
							this.locale.editProfileDialog.errors.firstNameTooLong
						break
					case ErrorCodes.LastNameTooLong:
						this.editProfileDialogLastNameError =
							this.locale.editProfileDialog.errors.lastNameTooLong
						break
					case ErrorCodes.WebsiteUrlInvalid:
						this.editProfileDialogWebsiteUrlError =
							this.locale.editProfileDialog.errors.websiteUrlInvalid
						break
					case ErrorCodes.FacebookUsernameInvalid:
						this.editProfileDialogFacebookUsernameError =
							this.locale.editProfileDialog.errors.usernameInvalid
						break
					case ErrorCodes.InstagramUsernameInvalid:
						this.editProfileDialogInstagramUsernameError =
							this.locale.editProfileDialog.errors.usernameInvalid
						break
					case ErrorCodes.TwitterUsernameInvalid:
						this.editProfileDialogTwitterUsernameError =
							this.locale.editProfileDialog.errors.usernameInvalid
						break
				}
			}
		}
	}

	async ProcessSetBioResponse(response: UpdateResponse<AuthorBioResource2>) {
		if (response.success) {
			this.author.ClearBios()
			await this.LoadBios()

			this.newBio = ""
			this.newBioError = ""
			this.bioMode = BioMode.Normal

			this.SetupBioLanguageDropdown()
			this.UpdateCurrentBio()
		} else if (response.errors.length > 0) {
			switch (response.errors[0]) {
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
		let response = await this.graphqlService.retrieveAuthor(
			`
				uuid
				collections {
					items {
						uuid
						storeBooks {
							items {
								uuid
								title
								cover {
									url
									blurhash
								}
							}
						}
					}
				}
				firstName
				lastName
				bio {
					bio
				}
				websiteUrl
				facebookUsername
				instagramUsername
				twitterUsername
				profileImage {
					url
					blurhash
				}
			`,
			{
				uuid: this.uuid,
				languages: await this.dataService.GetStoreLanguages()
			}
		)
		let responseData = response.data.retrieveAuthor

		if (responseData != null) {
			this.author = new Author(
				responseData,
				await this.dataService.GetStoreLanguages(),
				this.graphqlService
			)

			if (responseData.bio?.bio == null) {
				this.currentBio = ""
				this.bioMode = BioMode.None
			} else {
				this.currentBio = responseData.bio.bio
				this.bioMode = BioMode.Normal
			}

			// Get the store books of the author
			let collections = responseData.collections.items

			for (let collection of collections) {
				for (let storeBook of collection.storeBooks.items) {
					let bookItem: BookListItem = {
						uuid: storeBook.uuid,
						title: storeBook.title,
						coverContent: null,
						coverBlurhash: storeBook.cover?.blurhash
					}

					if (storeBook.cover?.url != null) {
						this.graphqlService
							.GetFile({ url: storeBook.cover.url })
							.then(
								(
									fileResponse: ApiResponse<string> | ApiErrorResponse
								) => {
									if (isSuccessStatusCode(fileResponse.status)) {
										bookItem.coverContent = (
											fileResponse as ApiResponse<string>
										).data
									}
								}
							)
					}

					this.books.push(bookItem)
				}
			}

			this.UpdateSocialMediaLinks()
		}
	}

	UpdateSocialMediaLinks() {
		this.facebookLink = GenerateFacebookLink(this.author.facebookUsername)
		this.instagramLink = GenerateInstagramLink(this.author.instagramUsername)
		this.twitterLink = GenerateTwitterLink(this.author.twitterUsername)
	}
}
