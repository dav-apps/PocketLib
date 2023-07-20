import { Component } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { faPlus as faPlusLight } from "@fortawesome/pro-light-svg-icons"
import { ApiErrorResponse, ApiResponse, isSuccessStatusCode } from "dav-js"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { GraphQLService } from "src/app/services/graphql-service"
import { CachingService } from "src/app/services/caching-service"
import * as ErrorCodes from "src/constants/errorCodes"
import { GetDualScreenSettings } from "src/app/misc/utils"
import { enUS } from "src/locales/locales"
import {
	PublisherResource,
	PublisherField,
	AuthorField,
	AuthorResource
} from "src/app/misc/types"
import { Publisher } from "src/app/models/Publisher"
import { Author } from "src/app/models/Author"

@Component({
	selector: "pocketlib-author-page",
	templateUrl: "./author-page.component.html",
	styleUrls: ["./author-page.component.scss"]
})
export class AuthorPageComponent {
	locale = enUS.authorPage
	faPlusLight = faPlusLight
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	uuid: string
	createPublisherDialogVisible: boolean = false
	createPublisherDialogLoading: boolean = false
	createPublisherDialogName: string = ""
	createPublisherDialogNameError: string = ""
	createAuthorDialogVisible: boolean = false
	createAuthorDialogLoading: boolean = false
	createAuthorDialogFirstName: string = ""
	createAuthorDialogLastName: string = ""
	createAuthorDialogFirstNameError: string = ""
	createAuthorDialogLastNameError: string = ""
	booksInReview: {
		uuid: string
		title: string
	}[] = []

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private graphqlService: GraphQLService,
		private cachingService: CachingService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().authorPage

		// Check if this is a dual-screen device with a vertical fold
		let dualScreenSettings = GetDualScreenSettings()
		this.dualScreenLayout = dualScreenSettings.dualScreenLayout
		this.dualScreenFoldMargin = dualScreenSettings.dualScreenFoldMargin

		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get("uuid")
	}

	async ngOnInit() {
		await this.dataService.userPromiseHolder.AwaitResult()

		if (this.dataService.userIsAdmin && !this.uuid) {
			// Get the books in review
			let response = await this.graphqlService.listStoreBooks(
				`
					items {
						uuid
						title
					}
				`,
				{
					inReview: true,
					languages: await this.dataService.GetStoreLanguages()
				}
			)

			let responseData = response.data.listStoreBooks

			if (responseData != null) {
				this.booksInReview = []

				for (let book of responseData.items) {
					this.booksInReview.push({
						uuid: book.uuid,
						title: book.title
					})
				}
			}
		} else if (
			!this.dataService.userAuthor &&
			!this.dataService.userIsAdmin
		) {
			this.router.navigate(["/"])
		}
	}

	ShowPublisher(uuid: string) {
		this.router.navigate(["publisher", uuid])
	}

	ShowAuthor(uuid: string) {
		this.router.navigate(["author", uuid])
	}

	ShowBook(uuid: string) {
		this.router.navigate(["store", "book", uuid])
	}

	ShowCreatePublisherDialog() {
		this.createPublisherDialogName = ""
		this.createPublisherDialogNameError = ""
		this.createPublisherDialogVisible = true
		this.createPublisherDialogLoading = false
	}

	async CreatePublisher() {
		this.createPublisherDialogNameError = ""
		this.createPublisherDialogLoading = true

		let response = await this.apiService.CreatePublisher({
			name: this.createPublisherDialogName,
			fields: [
				PublisherField.uuid,
				PublisherField.name,
				PublisherField.description,
				PublisherField.websiteUrl,
				PublisherField.facebookUsername,
				PublisherField.instagramUsername,
				PublisherField.twitterUsername,
				PublisherField.logo
			]
		})

		this.createPublisherDialogLoading = false

		if (isSuccessStatusCode(response.status)) {
			let responseData = (response as ApiResponse<PublisherResource>).data

			// Add the publisher to the publishers of the admin in DataService
			this.dataService.adminPublishers.push(
				new Publisher(
					responseData,
					await this.dataService.GetStoreLanguages(),
					this.apiService,
					this.graphqlService,
					this.cachingService
				)
			)

			// Redirect to the publisher page of the new publisher
			this.router.navigate(["publisher", responseData.uuid])
		} else {
			for (let error of (response as ApiErrorResponse).errors) {
				switch (error.code) {
					case ErrorCodes.NameTooShort:
						if (this.createPublisherDialogName.length == 0) {
							this.createPublisherDialogNameError =
								this.locale.createPublisherDialog.errors.nameMissing
						} else {
							this.createPublisherDialogNameError =
								this.locale.createPublisherDialog.errors.nameTooShort
						}
						break
					case ErrorCodes.NameTooLong:
						this.createPublisherDialogNameError =
							this.locale.createPublisherDialog.errors.nameTooLong
						break
					default:
						this.createPublisherDialogNameError =
							this.locale.createPublisherDialog.errors.unexpectedError
						break
				}
			}
		}
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

		let response = await this.apiService.CreateAuthor({
			firstName: this.createAuthorDialogFirstName,
			lastName: this.createAuthorDialogLastName,
			fields: [
				AuthorField.uuid,
				AuthorField.firstName,
				AuthorField.lastName,
				AuthorField.websiteUrl,
				AuthorField.facebookUsername,
				AuthorField.instagramUsername,
				AuthorField.twitterUsername,
				AuthorField.profileImage
			]
		})

		this.createAuthorDialogLoading = false

		if (isSuccessStatusCode(response.status)) {
			let responseData = (response as ApiResponse<AuthorResource>).data

			// Add the author to the admin authors in DataService
			this.dataService.adminAuthors.push(
				new Author(
					responseData,
					await this.dataService.GetStoreLanguages(),
					this.apiService,
					this.graphqlService,
					this.cachingService
				)
			)

			// Redirect to the author page of the new author
			this.router.navigate(["author", responseData.uuid])
		} else {
			for (let error of (response as ApiErrorResponse).errors) {
				switch (error.code) {
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
