import {
	Component,
	Input,
	Output,
	EventEmitter,
	HostListener,
	ViewChild
} from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { MutationResult } from "apollo-angular"
import { ReadFile } from "ngx-file-helpers"
import { faGlobe as faGlobeLight } from "@fortawesome/pro-light-svg-icons"
import {
	faFacebook,
	faInstagram,
	faTwitter
} from "@fortawesome/free-brands-svg-icons"
import { Dav, isSuccessStatusCode } from "dav-js"
import { DropdownOption, DropdownOptionType } from "dav-ui-components"
import { EditAuthorProfileDialogComponent } from "src/app/components/dialogs/edit-author-profile-dialog/edit-author-profile-dialog.component"
import { ProfileImageDialogComponent } from "src/app/components/dialogs/profile-image-dialog/profile-image-dialog.component"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { Author } from "src/app/models/Author"
import {
	GetLanguageByString,
	GenerateFacebookLink,
	GenerateInstagramLink,
	GenerateTwitterLink
} from "src/app/misc/utils"
import {
	ApiResponse,
	BookListItem,
	AuthorMode,
	AuthorBioResource,
	StoreBookItem,
	StoreBookStatus
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
	coverContent: string
	coverBlurhash: string
}

enum BioMode {
	None = 0, // If the author has no bios and has not selected to add a bio, show nothing
	New = 1, // If the author has selected a language to add, show the input for creating a bio
	Normal = 2, // If the author has one or more bios, show the selected bio
	NormalEdit = 3 // If the author has one or more bios and the user is editing the bio of the selected language
}

const maxProfileImageFileSize = 2000000
const maxItemsPerPage = 5

@Component({
	selector: "pocketlib-author-profile",
	templateUrl: "./author-profile.component.html",
	styleUrls: ["./author-profile.component.scss"]
})
export class AuthorProfileComponent {
	locale = enUS.authorProfile
	faGlobeLight = faGlobeLight
	faFacebook = faFacebook
	faInstagram = faInstagram
	faTwitter = faTwitter
	@Input() slug: string
	@Output() loaded = new EventEmitter()
	collectionsLoaded: boolean = false
	seriesLoaded: boolean = false
	storeContext: boolean = true // Whether the component is shown in the Store
	authorMode: AuthorMode = AuthorMode.Normal
	author: Author = new Author(null, this.dataService, this.apiService)
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
	pages: number = 1
	page: number = 1

	//#region VlbAuthor variables
	vlbAuthorUuid: string = ""
	vlbAuthorSlug: string = ""
	vlbAuthorFirstName: string = ""
	vlbAuthorLastName: string = ""
	vlbAuthorDescription: string = ""
	vlbItemsLoading: boolean = false
	//#endregion

	//#region ProfileImageDialog
	@ViewChild("profileImageDialog")
	profileImageDialog: ProfileImageDialogComponent
	//#endregion

	//#region EditProfileDialog
	@ViewChild("editProfileDialog")
	editProfileDialog: EditAuthorProfileDialogComponent
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
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().authorProfile
		this.storeContext = this.dataService.currentUrl.startsWith("/store")

		this.activatedRoute.url.subscribe(() => {
			let urlSegments = this.activatedRoute.snapshot.url
			if (urlSegments.length == 0) return

			const queryParams = this.activatedRoute.snapshot.queryParamMap

			if (queryParams.has("page")) {
				this.page = Number(queryParams.get("page"))

				if (this.authorMode == AuthorMode.VlbAuthor) {
					this.loadVlbAuthorItems()
				}
			} else {
				this.page = 1
			}
		})
	}

	async ngOnInit() {
		this.setSize()

		await this.dataService.userPromiseHolder.AwaitResult()
		await this.dataService.userAuthorPromiseHolder.AwaitResult()

		let author = null

		if (this.dataService.userIsAdmin) {
			this.authorMode = AuthorMode.AuthorOfAdmin
			author = this.dataService.adminAuthors.find(
				author => author.slug == this.slug
			)

			if (author == null) {
				author = await Author.Retrieve(
					this.slug,
					this.dataService,
					this.apiService
				)
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

			// VlbAuthor
			let retrieveVlbAuthorResponse =
				await this.apiService.retrieveVlbAuthor(
					`
						uuid
						slug
						firstName
						lastName
						description
					`,
					{ uuid: this.slug }
				)

			let retrieveVlbAuthorResponseData =
				retrieveVlbAuthorResponse.data?.retrieveVlbAuthor

			if (retrieveVlbAuthorResponseData == null) {
				// Get the author from the server
				await this.LoadAuthor()
			} else {
				this.authorMode = AuthorMode.VlbAuthor
				this.vlbAuthorUuid = retrieveVlbAuthorResponseData.uuid
				this.vlbAuthorSlug = retrieveVlbAuthorResponseData.slug
				this.vlbAuthorFirstName = retrieveVlbAuthorResponseData.firstName
				this.vlbAuthorLastName = retrieveVlbAuthorResponseData.lastName
				this.vlbAuthorDescription =
					retrieveVlbAuthorResponseData.description ?? ""

				// Get the books of the author
				await this.loadVlbAuthorItems()
				return
			}
		} else if (author == null) {
			return
		}

		this.UpdateSocialMediaLinks()

		if (this.author.profileImage?.url != null) {
			// Load the author profile image
			this.apiService
				.downloadFile(this.author.profileImage.url)
				.then((fileResponse: ApiResponse<string>) => {
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

	async loadVlbAuthorItems() {
		this.vlbItemsLoading = true

		let listVlbItemsResponse = await this.apiService.listVlbItems(
			`
				total
				items {
					id
					title
					coverUrl
				}
			`,
			{
				vlbAuthorUuid: this.vlbAuthorUuid,
				limit: maxItemsPerPage,
				offset: (this.page - 1) * maxItemsPerPage
			}
		)

		this.vlbItemsLoading = false

		let listVlbItemsResponseData = listVlbItemsResponse.data?.listVlbItems
		if (listVlbItemsResponseData == null) return

		this.books = []

		for (let item of listVlbItemsResponseData.items) {
			this.books.push({
				uuid: item.id,
				slug: item.id,
				title: item.title,
				coverContent: item.coverUrl,
				coverBlurhash: null
			})
		}

		this.pages = Math.floor(listVlbItemsResponseData.total / maxItemsPerPage)
	}

	@HostListener("window:resize")
	setSize() {
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

		let collectionsResult = await this.author.GetCollections()

		for (let collection of collectionsResult.items) {
			let collectionItem: CollectionItem = {
				uuid: collection.uuid,
				name: collection.name.name,
				link: "",
				books: []
			}

			let storeBooksResult = await collection.GetStoreBooks()

			for (let book of storeBooksResult.items) {
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

		let seriesResult = await this.author.GetSeries()

		for (let series of seriesResult.items) {
			let storeBooksResult = await series.GetStoreBooks({ limit: 1 })
			if (storeBooksResult.total == 0) continue

			let link = `/author/series/${series.uuid}`

			if (this.authorMode == AuthorMode.AuthorOfAdmin) {
				link = `/author/${this.author.uuid}/series/${series.uuid}`
			}

			this.series.push({
				uuid: series.uuid,
				name: series.name,
				link,
				coverContent: await storeBooksResult.items[0].GetCoverContent(),
				coverBlurhash: storeBooksResult.items[0].cover?.blurhash
			})
		}

		this.seriesLoaded = true
	}

	async LoadBios() {
		this.bios = []
		let biosResult = await this.author.GetBios()

		for (let bio of biosResult.items) {
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
				let response = await this.apiService.setAuthorBio(`uuid`, {
					uuid: "mine",
					language: this.bioLanguageDropdownSelectedKey,
					bio: this.newBio
				})

				await this.ProcessSetBioResponse(response)
			} else {
				let response = await this.apiService.setAuthorBio(`uuid`, {
					uuid: this.author.uuid,
					language: this.bioLanguageDropdownSelectedKey,
					bio: this.newBio
				})

				await this.ProcessSetBioResponse(response)
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

	bookItemClick(event: Event, book: BookListItem) {
		event.preventDefault()
		this.router.navigate(["store", "book", book.uuid])
	}

	collectionItemClick(event: Event, collection: CollectionItem) {
		event.preventDefault()
		this.router.navigate([collection.link])
	}

	seriesItemClick(event: Event, series: SeriesItem) {
		event.preventDefault()
		this.router.navigate([series.link])
	}

	NavigateToNewBookPage() {
		this.router.navigate(["author", this.author.uuid, "book", "new"])
	}

	NavigateToNewSeriesPage() {
		this.router.navigate(["author", this.author.uuid, "series", "new"])
	}

	async ProfileImageFileSelected(file: ReadFile) {
		this.errorMessage = ""
		this.profileImageDialog.show(file)
	}

	async UploadProfileImage(result: { canvas: HTMLCanvasElement }) {
		this.profileImageDialog.hide()
		let oldProfileImageContent = this.profileImageContent

		let blob = await new Promise<Blob>((r: Function) =>
			result.canvas.toBlob((blob: Blob) => r(blob), "image/jpeg", 0.5)
		)

		if (blob.size > maxProfileImageFileSize) {
			this.errorMessage = this.locale.errors.profileImageFileTooLarge
			return
		}

		this.profileImageLoading = true
		this.profileImageContent = result.canvas.toDataURL("image/png")

		// Send the file content to the server
		let response = await this.apiService.uploadAuthorProfileImage({
			uuid:
				this.authorMode == AuthorMode.AuthorOfUser
					? "mine"
					: this.author.uuid,
			contentType: blob.type,
			data: blob
		})

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
		this.editProfileDialogWebsiteUrl = this.author.websiteUrl || ""
		this.editProfileDialogWebsiteUrlError = ""
		this.editProfileDialogFacebookUsername =
			this.author.facebookUsername || ""
		this.editProfileDialogFacebookUsernameError = ""
		this.editProfileDialogInstagramUsername =
			this.author.instagramUsername || ""
		this.editProfileDialogInstagramUsernameError = ""
		this.editProfileDialogTwitterUsername = this.author.twitterUsername || ""
		this.editProfileDialogTwitterUsernameError = ""
		this.editProfileDialog.show()
	}

	async SaveProfile(result: {
		firstName: string
		lastName: string
		websiteUrl: string
		facebookUsername: string
		instagramUsername: string
		twitterUsername: string
	}) {
		this.editProfileDialogFirstNameError = ""
		this.editProfileDialogLastNameError = ""
		this.editProfileDialogWebsiteUrlError = ""
		this.editProfileDialogFacebookUsernameError = ""
		this.editProfileDialogInstagramUsernameError = ""
		this.editProfileDialogTwitterUsernameError = ""

		let response = await this.apiService.updateAuthor(
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
				firstName: result.firstName,
				lastName: result.lastName,
				websiteUrl: result.websiteUrl,
				facebookUsername: result.facebookUsername,
				instagramUsername: result.instagramUsername,
				twitterUsername: result.twitterUsername
			}
		)

		if (response.errors == null) {
			let responseData = response.data.updateAuthor
			this.editProfileDialog.hide()

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
					case ErrorCodes.firstNameTooShort:
						if (this.editProfileDialogFirstName.length == 0) {
							this.editProfileDialogFirstNameError =
								this.locale.errors.firstNameMissing
						} else {
							this.editProfileDialogFirstNameError =
								this.locale.errors.firstNameTooShort
						}
						break
					case ErrorCodes.lastNameTooShort:
						if (this.editProfileDialogLastName.length == 0) {
							this.editProfileDialogLastNameError =
								this.locale.errors.lastNameMissing
						} else {
							this.editProfileDialogLastNameError =
								this.locale.errors.lastNameTooShort
						}
						break
					case ErrorCodes.firstNameTooLong:
						this.editProfileDialogFirstNameError =
							this.locale.errors.firstNameTooLong
						break
					case ErrorCodes.lastNameTooLong:
						this.editProfileDialogLastNameError =
							this.locale.errors.lastNameTooLong
						break
					case ErrorCodes.websiteUrlInvalid:
						this.editProfileDialogWebsiteUrlError =
							this.locale.errors.websiteUrlInvalid
						break
					case ErrorCodes.facebookUsernameInvalid:
						this.editProfileDialogFacebookUsernameError =
							this.locale.errors.usernameInvalid
						break
					case ErrorCodes.instagramUsernameInvalid:
						this.editProfileDialogInstagramUsernameError =
							this.locale.errors.usernameInvalid
						break
					case ErrorCodes.twitterUsernameInvalid:
						this.editProfileDialogTwitterUsernameError =
							this.locale.errors.usernameInvalid
						break
				}
			}
		}
	}

	async ProcessSetBioResponse(
		response: MutationResult<{ setAuthorBio: AuthorBioResource }>
	) {
		if (response.errors == null) {
			//this.author.ClearBios()
			await this.LoadBios()

			this.newBio = ""
			this.newBioError = ""
			this.bioMode = BioMode.Normal

			this.SetupBioLanguageDropdown()
			this.UpdateCurrentBio()
		} else {
			let errors = response.errors[0].extensions.errors as string[]

			switch (errors[0]) {
				case ErrorCodes.bioTooLong:
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
		this.author = await Author.Retrieve(
			this.slug,
			this.dataService,
			this.apiService
		)
		if (this.author == null) return null

		if (this.author.bio.bio == null) {
			this.currentBio = ""
			this.bioMode = BioMode.None
		} else {
			this.currentBio = this.author.bio.bio
			this.bioMode = BioMode.Normal
		}

		let collectionsResult = await this.author.GetCollections()

		for (let collection of collectionsResult.items) {
			let storeBooksResult = await collection.GetStoreBooks()

			for (let storeBook of storeBooksResult.items) {
				let bookItem: BookListItem = {
					uuid: storeBook.uuid,
					slug: storeBook.slug,
					title: storeBook.title,
					coverContent: null,
					coverBlurhash: storeBook.cover?.blurhash
				}

				if (storeBook.cover?.url != null) {
					this.apiService
						.downloadFile(storeBook.cover.url)
						.then((fileResponse: ApiResponse<string>) => {
							if (isSuccessStatusCode(fileResponse.status)) {
								bookItem.coverContent = (
									fileResponse as ApiResponse<string>
								).data
							}
						})
				}

				this.books.push(bookItem)
			}
		}
	}

	UpdateSocialMediaLinks() {
		this.facebookLink = GenerateFacebookLink(this.author.facebookUsername)
		this.instagramLink = GenerateInstagramLink(this.author.instagramUsername)
		this.twitterLink = GenerateTwitterLink(this.author.twitterUsername)
	}

	pageChange(page: number) {
		this.page = page
		this.router.navigate([], {
			queryParams: { page }
		})
		this.loadVlbAuthorItems()
	}
}
