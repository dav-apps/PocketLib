import { Component, ViewChild } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { faPlus as faPlusLight } from "@fortawesome/pro-light-svg-icons"
import { CreatePublisherDialogComponent } from "src/app/components/dialogs/create-publisher-dialog/create-publisher-dialog.component"
import { CreateAuthorDialogComponent } from "src/app/components/dialogs/create-author-dialog/create-author-dialog.component"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { LocalizationService } from "src/app/services/localization-service"
import * as ErrorCodes from "src/constants/errorCodes"
import { Publisher } from "src/app/models/Publisher"
import { Author } from "src/app/models/Author"

@Component({
	selector: "pocketlib-author-page",
	templateUrl: "./author-page.component.html",
	styleUrls: ["./author-page.component.scss"]
})
export class AuthorPageComponent {
	locale = this.localizationService.locale.authorPage
	faPlusLight = faPlusLight
	@ViewChild("createPublisherDialog")
	createPublisherDialog: CreatePublisherDialogComponent
	@ViewChild("createAuthorDialog")
	createAuthorDialog: CreateAuthorDialogComponent
	slug: string
	createPublisherDialogLoading: boolean = false
	createPublisherDialogNameError: string = ""
	createAuthorDialogLoading: boolean = false
	createAuthorDialogFirstNameError: string = ""
	createAuthorDialogLastNameError: string = ""
	booksInReview: {
		uuid: string
		title: string
		author: string
	}[] = []

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private localizationService: LocalizationService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		// Get the slug from the url
		this.slug = this.activatedRoute.snapshot.paramMap.get("slug")
	}

	async ngOnInit() {
		await this.dataService.userPromiseHolder.AwaitResult()

		if (this.dataService.userIsAdmin && !this.slug) {
			// Get the books in review
			let response = await this.apiService.listStoreBooks(
				`
					items {
						uuid
						title
						collection {
							author {
								firstName
								lastName
							}
						}
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
						title: book.title,
						author: `${book.collection.author.firstName} ${book.collection.author.lastName}`
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
		this.createPublisherDialogNameError = ""
		this.createPublisherDialogLoading = false
		this.createPublisherDialog.show()
	}

	async CreatePublisher(result: { name: string }) {
		this.createPublisherDialogNameError = ""
		this.createPublisherDialogLoading = true

		let response = await this.apiService.createPublisher(
			`
				uuid
				name
			`,
			{
				name: result.name
			}
		)

		this.createPublisherDialogLoading = false

		if (response.errors == null) {
			let responseData = response.data.createPublisher

			// Add the publisher to the publishers of the admin in DataService
			this.dataService.adminPublishers.push(
				new Publisher(responseData, this.dataService, this.apiService)
			)

			// Redirect to the publisher page of the new publisher
			this.router.navigate(["publisher", responseData.uuid])
		} else {
			let errors = response.errors[0].extensions.errors as string[]

			for (let errorCode of errors) {
				switch (errorCode) {
					case ErrorCodes.nameTooShort:
						if (result.name.length == 0) {
							this.createPublisherDialogNameError =
								this.locale.errors.nameMissing
						} else {
							this.createPublisherDialogNameError =
								this.locale.errors.nameTooShort
						}
						break
					case ErrorCodes.nameTooLong:
						this.createPublisherDialogNameError =
							this.locale.errors.nameTooLong
						break
					default:
						this.createPublisherDialogNameError =
							this.locale.errors.unexpectedError
						break
				}
			}
		}
	}

	ShowCreateAuthorDialog() {
		this.createAuthorDialogFirstNameError = ""
		this.createAuthorDialogLastNameError = ""
		this.createAuthorDialogLoading = false
		this.createAuthorDialog.show()
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
				firstName: result.firstName,
				lastName: result.lastName
			}
		)

		this.createAuthorDialogLoading = false

		if (response.errors == null) {
			let responseData = response.data.createAuthor

			// Add the author to the admin authors in DataService
			this.dataService.adminAuthors.push(
				new Author(responseData, this.dataService, this.apiService)
			)

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
