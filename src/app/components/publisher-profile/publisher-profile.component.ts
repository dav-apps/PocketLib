import {
	Component,
	Input,
	ElementRef,
	ViewChild,
	HostListener
} from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { ReadFile } from "ngx-file-helpers"
import {
	faGlobe as faGlobeLight,
	faPen as faPenLight
} from "@fortawesome/pro-light-svg-icons"
import {
	faFacebook,
	faInstagram,
	faTwitter
} from "@fortawesome/free-brands-svg-icons"
import Cropper from "cropperjs"
import { ApiResponse, ApiErrorResponse, isSuccessStatusCode } from "dav-js"
import { Publisher } from "src/app/models/Publisher"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { GraphQLService } from "src/app/services/graphql-service"
import {
	GenerateFacebookLink,
	GenerateInstagramLink,
	GenerateTwitterLink
} from "src/app/misc/utils"
import {
	AuthorListItem,
	PublisherMode,
	PublisherLogoResource
} from "src/app/misc/types"
import * as ErrorCodes from "src/constants/errorCodes"
import { enUS } from "src/locales/locales"

const maxLogoFileSize = 2000000
const maxAuthorsPerPage = 5

@Component({
	selector: "pocketlib-publisher-profile",
	templateUrl: "./publisher-profile.component.html",
	styleUrls: ["./publisher-profile.component.scss"]
})
export class PublisherProfileComponent {
	locale = enUS.publisherProfile
	faPenLight = faPenLight
	faGlobeLight = faGlobeLight
	faFacebook = faFacebook
	faInstagram = faInstagram
	faTwitter = faTwitter
	@Input() uuid: string
	publisherMode: PublisherMode = PublisherMode.Normal
	publisher: Publisher = new Publisher(null, [], this.graphqlService)
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
	authorItems: AuthorListItem[] = []
	authorsLoading: boolean = true
	hoveredAuthorItem: number = -1
	pages: number = 1
	page: number = 1

	//#region LogoDialog
	@ViewChild("logoDialogImage", { static: true })
	logoDialogImage: ElementRef<HTMLImageElement>
	logoDialogVisible: boolean = false
	logoCropper: Cropper
	//#endregion

	//#region EditProfileDialog
	editProfileDialogVisible: boolean = false
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
	createAuthorDialogVisible: boolean = false
	createAuthorDialogLoading: boolean = false
	createAuthorDialogFirstName: string = ""
	createAuthorDialogLastName: string = ""
	createAuthorDialogFirstNameError: string = ""
	createAuthorDialogLastNameError: string = ""
	//#endregion

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private graphqlService: GraphQLService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().publisherProfile

		this.storeContext = this.dataService.currentUrl.startsWith("/store")

		this.activatedRoute.url.subscribe(() => {
			let urlSegments = this.activatedRoute.snapshot.url
			if (urlSegments.length == 0) return

			if (this.activatedRoute.snapshot.queryParamMap.has("page")) {
				this.page = +this.activatedRoute.snapshot.queryParamMap.get("page")
			} else {
				this.page = 1
			}
		})
	}

	async ngOnInit() {
		this.setSize()

		await this.dataService.userPromiseHolder.AwaitResult()
		await this.dataService.userAuthorPromiseHolder.AwaitResult()

		let publisher = null

		if (this.dataService.userIsAdmin) {
			this.publisherMode = PublisherMode.PublisherOfAdmin
			publisher = this.dataService.adminPublishers.find(
				publisher => publisher.uuid == this.uuid
			)
		} else if (this.dataService.userPublisher) {
			this.publisherMode = PublisherMode.PublisherOfUser
			publisher = this.dataService.userPublisher
		}

		if (publisher == null && this.storeContext) {
			this.publisherMode = PublisherMode.Normal

			// Get the publisher from the server
			await this.LoadPublisher()
		} else if (publisher == null) {
			return
		} else {
			this.publisher = publisher
		}

		if (this.publisher == null) return
		this.UpdateSocialMediaLinks()

		if (this.publisher.logo?.url != null) {
			// Load the publisher profile image
			this.graphqlService
				.GetFile({ url: this.publisher.logo.url })
				.then((fileResponse: ApiResponse<string> | ApiErrorResponse) => {
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
		this.authorsLoading = false
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

	async LoadPublisher() {
		let response = await this.graphqlService.retrievePublisher(
			`
				uuid
				name
				description
				websiteUrl
				facebookUsername
				instagramUsername
				twitterUsername
				logo {
					url
					blurhash
				}
			`,
			{
				uuid: this.uuid
			}
		)

		let responseData = response.data.retrievePublisher

		if (responseData != null) {
			this.publisher = new Publisher(
				responseData,
				await this.dataService.GetStoreLanguages(),
				this.graphqlService
			)
		}
	}

	async LoadAuthors() {
		this.authorItems = []
		this.authorsLoading = true

		for (let author of await this.publisher.GetAuthors(
			this.page,
			maxAuthorsPerPage
		)) {
			let authorItem: AuthorListItem = {
				uuid: author.uuid,
				firstName: author.firstName,
				lastName: author.lastName,
				profileImageContent: this.dataService.defaultProfileImageUrl,
				profileImageBlurhash: author.profileImage.blurhash,
				profileImageAlt: this.dataService
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

		this.pages = this.publisher.GetAuthorPages(this.page, maxAuthorsPerPage)
		this.authorsLoading = false
	}

	PageChange(page: number) {
		this.page = page
		this.router.navigate([], { queryParams: { page } })
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
		this.logoDialogVisible = true

		this.logoDialogImage.nativeElement.onload = () => {
			this.logoCropper = new Cropper(this.logoDialogImage.nativeElement, {
				aspectRatio: 1,
				autoCropArea: 1,
				viewMode: 2
			})
		}

		this.logoDialogImage.nativeElement.src = file.content
	}

	async UploadLogo() {
		this.logoDialogVisible = false
		let oldLogoContent = this.logoContent

		let canvas = this.logoCropper.getCroppedCanvas()
		let blob = await new Promise<Blob>((r: Function) =>
			canvas.toBlob((blob: Blob) => r(blob), "image/jpeg", 0.5)
		)
		this.logoCropper.destroy()

		if (blob.size > maxLogoFileSize) {
			this.errorMessage = this.locale.errors.logoFileTooLarge
			return
		}

		this.logoLoading = true
		this.logoContent = canvas.toDataURL("image/png")

		// Send the file content to the server
		let response: ApiResponse<PublisherLogoResource> | ApiErrorResponse

		if (this.publisherMode == PublisherMode.PublisherOfUser) {
			response = await this.apiService.UploadPublisherLogo({
				uuid: "mine",
				type: blob.type,
				file: blob
			})
		} else {
			response = await this.apiService.UploadPublisherLogo({
				uuid: this.uuid,
				type: blob.type,
				file: blob
			})
		}

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
		this.editProfileDialogWebsiteUrl = this.publisher.websiteUrl
		this.editProfileDialogWebsiteUrlError = ""
		this.editProfileDialogFacebookUsername = this.publisher.facebookUsername
		this.editProfileDialogFacebookUsernameError = ""
		this.editProfileDialogInstagramUsername = this.publisher.instagramUsername
		this.editProfileDialogInstagramUsernameError = ""
		this.editProfileDialogTwitterUsername = this.publisher.twitterUsername
		this.editProfileDialogTwitterUsernameError = ""
		this.editProfileDialogVisible = true
	}

	async SaveProfile() {
		this.editProfileDialogNameError = ""
		this.editProfileDialogWebsiteUrlError = ""
		this.editProfileDialogFacebookUsernameError = ""
		this.editProfileDialogInstagramUsernameError = ""
		this.editProfileDialogTwitterUsernameError = ""

		let response = await this.graphqlService.updatePublisher(
			`
				name
				websiteUrl
				facebookUsername
				instagramUsername
				twitterUsername
			`,
			{
				uuid: this.dataService.userIsAdmin ? this.publisher.uuid : "mine",
				name: this.editProfileDialogName,
				websiteUrl: this.editProfileDialogWebsiteUrl,
				facebookUsername: this.editProfileDialogFacebookUsername,
				instagramUsername: this.editProfileDialogInstagramUsername,
				twitterUsername: this.editProfileDialogTwitterUsername
			}
		)

		if (response.errors == null) {
			let responseData = response.data.updatePublisher
			this.editProfileDialogVisible = false

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
					case ErrorCodes.NameTooShort:
						if (this.editProfileDialogName.length == 0) {
							this.editProfileDialogNameError =
								this.locale.editProfileDialog.errors.nameMissing
						} else {
							this.editProfileDialogNameError =
								this.locale.editProfileDialog.errors.nameTooShort
						}
						break
					case ErrorCodes.NameTooLong:
						this.editProfileDialogNameError =
							this.locale.editProfileDialog.errors.nameTooLong
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

	async EditDescription() {
		if (this.editDescription) {
			this.newDescriptionError = ""
			this.descriptionLoading = true

			let response = await this.graphqlService.updatePublisher(
				`description`,
				{
					uuid: this.dataService.userIsAdmin
						? this.publisher.uuid
						: "mine",
					description: this.newDescription
				}
			)

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
					case ErrorCodes.DescriptionTooLong:
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
		this.createAuthorDialogFirstName = ""
		this.createAuthorDialogFirstNameError = ""
		this.createAuthorDialogLastName = ""
		this.createAuthorDialogLastNameError = ""
		this.createAuthorDialogVisible = true
		this.createAuthorDialogLoading = false
	}

	async CreateAuthor() {
		this.createAuthorDialogFirstNameError = ""
		this.createAuthorDialogLastNameError = ""
		this.createAuthorDialogLoading = true

		let response = await this.graphqlService.createAuthor(
			`
				uuid
				firstName
				lastName
			`,
			{
				publisher: this.publisher.uuid,
				firstName: this.createAuthorDialogFirstName,
				lastName: this.createAuthorDialogLastName
			}
		)

		this.createAuthorDialogLoading = false

		if (response.errors == null) {
			let responseData = response.data.createAuthor

			// Clear the authors of the publisher
			this.publisher.ClearAuthors()

			// Redirect to the author page of the new author
			this.router.navigate(["author", responseData.uuid])
		} else {
			let errors = response.errors[0].extensions.errors as string[]

			for (let errorCode of errors) {
				switch (errorCode) {
					case ErrorCodes.FirstNameTooShort:
						if (this.createAuthorDialogFirstName.length == 0) {
							this.createAuthorDialogFirstNameError =
								this.locale.createAuthorDialog.errors.firstNameMissing
						} else {
							this.createAuthorDialogFirstNameError =
								this.locale.createAuthorDialog.errors.firstNameTooShort
						}
						break
					case ErrorCodes.LastNameTooShort:
						if (this.createAuthorDialogLastName.length == 0) {
							this.createAuthorDialogLastNameError =
								this.locale.createAuthorDialog.errors.lastNameMissing
						} else {
							this.createAuthorDialogLastNameError =
								this.locale.createAuthorDialog.errors.lastNameTooShort
						}
						break
					case ErrorCodes.FirstNameTooLong:
						this.createAuthorDialogFirstNameError =
							this.locale.createAuthorDialog.errors.firstNameTooLong
						break
					case ErrorCodes.LastNameTooLong:
						this.createAuthorDialogLastNameError =
							this.locale.createAuthorDialog.errors.lastNameTooLong
						break
					default:
						this.createAuthorDialogFirstNameError =
							this.locale.createAuthorDialog.errors.unexpectedError
						break
				}
			}
		}
	}
}
