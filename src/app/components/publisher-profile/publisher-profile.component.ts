import {
	Component,
	Input,
	ViewChild,
	ElementRef,
	HostListener
} from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { ReadFile } from "ngx-file-helpers"
import { faGlobe as faGlobeLight } from "@fortawesome/pro-light-svg-icons"
import {
	faFacebook,
	faInstagram,
	faTwitter
} from "@fortawesome/free-brands-svg-icons"
import { isSuccessStatusCode } from "dav-js"
import { Textfield } from "dav-ui-components"
import { LogoDialogComponent } from "src/app/components/dialogs/logo-dialog/logo-dialog.component"
import { EditPublisherProfileDialogComponent } from "src/app/components/dialogs/edit-publisher-profile-dialog/edit-publisher-profile-dialog.component"
import { CreateAuthorDialogComponent } from "src/app/components/dialogs/create-author-dialog/create-author-dialog.component"
import { Publisher } from "src/app/models/Publisher"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import {
	GenerateFacebookLink,
	GenerateInstagramLink,
	GenerateTwitterLink
} from "src/app/misc/utils"
import { ApiResponse, BookListItem, PublisherMode } from "src/app/misc/types"
import * as ErrorCodes from "src/constants/errorCodes"
import { enUS } from "src/locales/locales"

const maxLogoFileSize = 2000000
const maxAuthorsPerPage = 5
const maxVlbItemsPerPage = 5

interface AuthorItem {
	uuid: string
	slug: string
	name: string
	profileImageContent: string
	profileImageBlurhash: string
	alt: string
}

@Component({
	selector: "pocketlib-publisher-profile",
	templateUrl: "./publisher-profile.component.html",
	styleUrls: ["./publisher-profile.component.scss"]
})
export class PublisherProfileComponent {
	locale = enUS.publisherProfile
	faGlobeLight = faGlobeLight
	faFacebook = faFacebook
	faInstagram = faInstagram
	faTwitter = faTwitter
	@Input() slug: string
	publisherMode: PublisherMode = PublisherMode.Normal
	publisher: Publisher = new Publisher(null, this.dataService, this.apiService)
	facebookLink: string = ""
	instagramLink: string = ""
	twitterLink: string = ""
	logoContent: string = this.dataService.defaultProfileImageUrl
	logoAlt: string = ""
	logoWidth: number = 200
	logoLoading: boolean = false
	editDescription: boolean = false
	newDescription: string = ""
	newDescriptionError: string = ""
	descriptionLoading: boolean = false
	errorMessage: string = ""
	storeContext: boolean = true // Whether the component is shown in the Store
	authorItems: AuthorItem[] = []
	authorsLoading: boolean = true
	searchAuthorsLoading: boolean = false
	searchQuery: string = ""
	getAuthorsPromiseKey: number = 0
	pages: number = 1
	page: number = 1
	@ViewChild("searchTextfield")
	searchTextfield: ElementRef<Textfield>

	//#region VlbPublisher variables
	vlbPublisherId: string = ""
	vlbPublisherName: string = ""
	vlbPublisherUrl: string = ""
	vlbItemsLoading: boolean = false
	books: BookListItem[] = []
	//#endregion

	//#region LogoDialog
	@ViewChild("logoDialog")
	logoDialog: LogoDialogComponent
	//#endregion

	//#region EditProfileDialog
	@ViewChild("editProfileDialog")
	editProfileDialog: EditPublisherProfileDialogComponent
	editProfileDialogName: string = ""
	editProfileDialogNameError: string = ""
	editProfileDialogWebsiteUrl: string = ""
	editProfileDialogWebsiteUrlError: string = ""
	editProfileDialogFacebookUsername: string = ""
	editProfileDialogFacebookUsernameError: string = ""
	editProfileDialogInstagramUsername: string = ""
	editProfileDialogInstagramUsernameError: string = ""
	editProfileDialogTwitterUsername: string = ""
	editProfileDialogTwitterUsernameError: string = ""
	//#endregion

	//#region CreateAuthorDialog
	@ViewChild("createAuthorDialog")
	createAuthorDialog: CreateAuthorDialogComponent
	createAuthorDialogLoading: boolean = false
	createAuthorDialogFirstNameError: string = ""
	createAuthorDialogLastNameError: string = ""
	//#endregion

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().publisherProfile

		this.storeContext = this.dataService.currentUrl.startsWith("/store")

		this.activatedRoute.url.subscribe(() => {
			let urlSegments = this.activatedRoute.snapshot.url
			if (urlSegments.length == 0) return

			const queryParams = this.activatedRoute.snapshot.queryParamMap

			if (queryParams.has("page")) {
				this.page = Number(queryParams.get("page"))

				if (this.publisherMode == PublisherMode.VlbPublisher) {
					this.loadVlbPublisherItems()
				}
			} else {
				this.page = 1
			}

			if (queryParams.has("query")) {
				this.searchQuery = queryParams.get("query")
			}
		})
	}

	async ngOnInit() {
		this.setSize()

		await this.dataService.userPromiseHolder.AwaitResult()
		await this.dataService.userAuthorPromiseHolder.AwaitResult()

		// Set the default value of the search textfield, given in the url
		this.searchTextfield.nativeElement.value = this.searchQuery

		let publisher = null

		if (!this.slug.includes("-")) {
			// VlbPublisher
			let retrieveVlbPublisherResponse =
				await this.apiService.retrieveVlbPublisher(
					`
						id
						name
						url
					`,
					{ id: this.slug }
				)

			let retrieveVlbPublisherResponseData =
				retrieveVlbPublisherResponse.data?.retrieveVlbPublisher

			if (retrieveVlbPublisherResponseData == null) return

			this.publisherMode = PublisherMode.VlbPublisher
			this.vlbPublisherId = retrieveVlbPublisherResponseData.id
			this.vlbPublisherName = retrieveVlbPublisherResponseData.name
			this.vlbPublisherUrl = retrieveVlbPublisherResponseData.url

			// Get book items
			await this.loadVlbPublisherItems()
			return
		} else if (this.dataService.userIsAdmin) {
			this.publisherMode = PublisherMode.PublisherOfAdmin
			publisher = this.dataService.adminPublishers.find(
				publisher => publisher.slug == this.slug
			)
		} else if (this.dataService.userPublisher) {
			this.publisherMode = PublisherMode.PublisherOfUser
			publisher = this.dataService.userPublisher
		}

		if (publisher == null && this.storeContext) {
			this.publisherMode = PublisherMode.Normal

			// Get the publisher from the server
			this.publisher = await Publisher.Retrieve(
				this.slug,
				this.dataService,
				this.apiService
			)
		} else if (publisher == null) {
			return
		} else {
			this.publisher = publisher
		}

		if (this.publisher == null) return
		this.UpdateSocialMediaLinks()

		if (this.publisher.logo?.url != null) {
			// Load the publisher profile image
			this.apiService
				.downloadFile(this.publisher.logo.url)
				.then((fileResponse: ApiResponse<string>) => {
					if (isSuccessStatusCode(fileResponse.status)) {
						this.logoContent = (fileResponse as ApiResponse<string>).data
					}
				})
		}

		this.logoAlt = this.dataService
			.GetLocale()
			.misc.publisherLogoAlt.replace("{0}", this.publisher.name)

		// Get the authors of the publisher
		await this.LoadAuthors()
	}

	@HostListener("window:resize")
	setSize() {
		if (window.innerWidth < 768) {
			this.logoWidth = 110
		} else if (window.innerWidth < 1200) {
			this.logoWidth = 120
		} else {
			this.logoWidth = 130
		}
	}

	async loadVlbPublisherItems() {
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
				vlbPublisherId: this.vlbPublisherId,
				limit: maxVlbItemsPerPage,
				offset: (this.page - 1) * maxVlbItemsPerPage
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

		this.pages = Math.floor(
			listVlbItemsResponseData.total / maxVlbItemsPerPage
		)
	}

	async LoadAuthors() {
		if (this.searchQuery.length > 0) {
			if (this.searchAuthorsLoading) {
				let searchQueryCopy = this.searchQuery
				await new Promise(resolve => setTimeout(resolve, 500))

				// Check if the query has changed
				if (this.searchQuery != searchQueryCopy) return
			}
		}

		this.searchAuthorsLoading = true

		let promiseKey = Math.random()
		this.getAuthorsPromiseKey = promiseKey
		this.authorItems = []

		let authorsResponse = await this.publisher.GetAuthors({
			limit: maxAuthorsPerPage,
			offset: (this.page - 1) * maxAuthorsPerPage,
			query: this.searchQuery
		})

		if (authorsResponse == null || this.getAuthorsPromiseKey != promiseKey) {
			return
		}

		for (let author of authorsResponse.items) {
			let authorItem: AuthorItem = {
				uuid: author.uuid,
				slug: author.slug,
				name: `${author.firstName} ${author.lastName}`,
				profileImageContent: this.dataService.defaultProfileImageUrl,
				profileImageBlurhash: author.profileImage.blurhash,
				alt: this.dataService
					.GetLocale()
					.misc.authorProfileImageAlt.replace(
						"{0}",
						`${author.firstName} ${author.lastName}`
					)
			}

			author.GetProfileImageContent().then((response: string) => {
				if (response != null) {
					authorItem.profileImageContent = response
				}
			})

			this.authorItems.push(authorItem)
		}

		this.pages = Math.floor(authorsResponse.total / maxAuthorsPerPage)
		this.authorsLoading = false
		this.searchAuthorsLoading = false
	}

	bookItemClick(event: Event, book: BookListItem) {
		event.preventDefault()
		this.router.navigate(["store", "book", book.uuid])
	}

	async searchQueryChange(event: CustomEvent) {
		this.searchQuery = event.detail.value

		this.router.navigate([], {
			queryParams: { page: this.page, query: this.searchQuery }
		})

		await this.LoadAuthors()
	}

	booksPageChange(page: number) {
		this.page = page
		this.router.navigate([], {
			queryParams: { page }
		})
		this.loadVlbPublisherItems()
	}

	authorPageChange(page: number) {
		this.page = page
		this.router.navigate([], {
			queryParams: { page, query: this.searchQuery }
		})
		this.LoadAuthors()
	}

	UpdateSocialMediaLinks() {
		this.facebookLink = GenerateFacebookLink(this.publisher.facebookUsername)
		this.instagramLink = GenerateInstagramLink(
			this.publisher.instagramUsername
		)
		this.twitterLink = GenerateTwitterLink(this.publisher.twitterUsername)
	}

	LogoFileSelected(file: ReadFile) {
		this.errorMessage = ""
		this.logoDialog.show(file)
	}

	async UploadLogo(result: { canvas: HTMLCanvasElement }) {
		this.logoDialog.hide()
		let oldLogoContent = this.logoContent

		let blob = await new Promise<Blob>((r: Function) =>
			result.canvas.toBlob((blob: Blob) => r(blob), "image/jpeg", 0.5)
		)

		if (blob.size > maxLogoFileSize) {
			this.errorMessage = this.locale.errors.logoFileTooLarge
			return
		}

		this.logoLoading = true
		this.logoContent = result.canvas.toDataURL("image/png")

		// Send the file content to the server
		let response = await this.apiService.uploadPublisherLogo({
			uuid:
				this.publisherMode == PublisherMode.PublisherOfUser
					? "mine"
					: this.publisher.uuid,
			contentType: blob.type,
			data: blob
		})

		if (isSuccessStatusCode(response.status)) {
			await this.publisher.ReloadLogo()
		} else {
			// Show the old logo
			this.logoContent = oldLogoContent
			this.errorMessage = this.locale.errors.logoUploadFailed
		}

		this.logoLoading = false
	}

	ShowEditProfileDialog() {
		this.editProfileDialogName = this.publisher.name
		this.editProfileDialogNameError = ""
		this.editProfileDialogWebsiteUrl = this.publisher.websiteUrl || ""
		this.editProfileDialogWebsiteUrlError = ""
		this.editProfileDialogFacebookUsername =
			this.publisher.facebookUsername || ""
		this.editProfileDialogFacebookUsernameError = ""
		this.editProfileDialogInstagramUsername =
			this.publisher.instagramUsername || ""
		this.editProfileDialogInstagramUsernameError = ""
		this.editProfileDialogTwitterUsername =
			this.publisher.twitterUsername || ""
		this.editProfileDialogTwitterUsernameError = ""
		this.editProfileDialog.show()
	}

	async SaveProfile(result: {
		name: string
		websiteUrl: string
		facebookUsername: string
		instagramUsername: string
		twitterUsername: string
	}) {
		this.editProfileDialogNameError = ""
		this.editProfileDialogWebsiteUrlError = ""
		this.editProfileDialogFacebookUsernameError = ""
		this.editProfileDialogInstagramUsernameError = ""
		this.editProfileDialogTwitterUsernameError = ""

		let response = await this.apiService.updatePublisher(
			`
				name
				websiteUrl
				facebookUsername
				instagramUsername
				twitterUsername
			`,
			{
				uuid: this.dataService.userIsAdmin ? this.publisher.uuid : "mine",
				name: result.name,
				websiteUrl: result.websiteUrl,
				facebookUsername: result.facebookUsername,
				instagramUsername: result.instagramUsername,
				twitterUsername: result.twitterUsername
			}
		)

		if (response.errors == null) {
			let responseData = response.data.updatePublisher
			this.editProfileDialog.hide()

			this.publisher.name = responseData.name
			this.publisher.websiteUrl = responseData.websiteUrl
			this.publisher.facebookUsername = responseData.facebookUsername
			this.publisher.instagramUsername = responseData.instagramUsername
			this.publisher.twitterUsername = responseData.twitterUsername

			this.UpdateSocialMediaLinks()
		} else {
			let errors = response.errors[0].extensions.errors as string[]

			for (let errorCode of errors) {
				switch (errorCode) {
					case ErrorCodes.nameTooShort:
						if (this.editProfileDialogName.length == 0) {
							this.editProfileDialogNameError =
								this.locale.errors.nameMissing
						} else {
							this.editProfileDialogNameError =
								this.locale.errors.nameTooShort
						}
						break
					case ErrorCodes.nameTooLong:
						this.editProfileDialogNameError =
							this.locale.errors.nameTooLong
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

	async EditDescription() {
		if (this.editDescription) {
			this.newDescriptionError = ""
			this.descriptionLoading = true

			let response = await this.apiService.updatePublisher(`description`, {
				uuid: this.dataService.userIsAdmin ? this.publisher.uuid : "mine",
				description: this.newDescription
			})

			this.descriptionLoading = false

			if (response.errors == null) {
				let responseData = response.data.updatePublisher

				this.publisher.description = responseData.description
				this.newDescription = ""
				this.newDescriptionError = ""
				this.editDescription = false
			} else {
				let errors = response.errors[0].extensions.errors as string[]

				switch (errors[0]) {
					case ErrorCodes.descriptionTooLong:
						this.newDescriptionError =
							this.locale.errors.descriptionTooLong
						break
					default:
						this.newDescriptionError = this.locale.errors.unexpectedError
						break
				}
			}
		} else {
			this.newDescription = this.publisher.description
			this.newDescriptionError = ""
			this.editDescription = true
		}
	}

	CancelEditDescription() {
		this.editDescription = false
		this.newDescription = ""
		this.newDescriptionError = ""
	}

	ShowCreateAuthorDialog() {
		this.createAuthorDialogFirstNameError = ""
		this.createAuthorDialogLastNameError = ""
		this.createAuthorDialogLoading = false
		this.createAuthorDialog.show()
	}

	authorItemClick(event: Event, author: AuthorItem) {
		event.preventDefault()
		this.router.navigate(["store", "author", author.slug])
	}

	async CreateAuthor(result: { firstName: string; lastName: string }) {
		this.createAuthorDialogFirstNameError = ""
		this.createAuthorDialogLastNameError = ""
		this.createAuthorDialogLoading = true

		let response = await this.apiService.createAuthor(
			`
				uuid
				firstName
				lastName
			`,
			{
				publisher: this.publisher.uuid,
				firstName: result.firstName,
				lastName: result.lastName
			}
		)

		this.createAuthorDialogLoading = false

		if (response.errors == null) {
			let responseData = response.data.createAuthor

			// Clear the authors of the publisher
			//this.publisher.ClearAuthors()

			// Redirect to the author page of the new author
			this.router.navigate(["author", responseData.uuid])
		} else {
			let errors = response.errors[0].extensions.errors as string[]

			for (let errorCode of errors) {
				switch (errorCode) {
					case ErrorCodes.firstNameTooShort:
						if (result.firstName.length == 0) {
							this.createAuthorDialogFirstNameError =
								this.locale.errors.firstNameMissing
						} else {
							this.createAuthorDialogFirstNameError =
								this.locale.errors.firstNameTooShort
						}
						break
					case ErrorCodes.lastNameTooShort:
						if (result.lastName.length == 0) {
							this.createAuthorDialogLastNameError =
								this.locale.errors.lastNameMissing
						} else {
							this.createAuthorDialogLastNameError =
								this.locale.errors.lastNameTooShort
						}
						break
					case ErrorCodes.firstNameTooLong:
						this.createAuthorDialogFirstNameError =
							this.locale.errors.firstNameTooLong
						break
					case ErrorCodes.lastNameTooLong:
						this.createAuthorDialogLastNameError =
							this.locale.errors.lastNameTooLong
						break
					default:
						this.createAuthorDialogFirstNameError =
							this.locale.errors.unexpectedError
						break
				}
			}
		}
	}
}
