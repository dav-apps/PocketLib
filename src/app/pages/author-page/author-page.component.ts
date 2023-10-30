import { Component, ViewChild } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { faPlus as faPlusLight } from "@fortawesome/pro-light-svg-icons"
import { CreatePublisherDialogComponent } from "src/app/components/dialogs/create-publisher-dialog/create-publisher-dialog.component"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import * as ErrorCodes from "src/constants/errorCodes"
import { enUS } from "src/locales/locales"
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
	@ViewChild("createPublisherDialog")
	createPublisherDialog: CreatePublisherDialogComponent
	uuid: string
	createPublisherDialogLoading: boolean = false
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
		author: string
	}[] = []

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().authorPage

		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get("uuid")
	}

	async ngOnInit() {
		await this.dataService.userPromiseHolder.AwaitResult()

		if (this.dataService.userIsAdmin && !this.uuid) {
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
		this.createPublisherDialog.show()
		this.createPublisherDialogLoading = false
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

		let response = await this.apiService.createAuthor(
			`
				uuid
				firstName
				lastName
			`,
			{
				firstName: this.createAuthorDialogFirstName,
				lastName: this.createAuthorDialogLastName
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
						if (this.createAuthorDialogFirstName.length == 0) {
							this.createAuthorDialogFirstNameError =
								this.locale.createAuthorDialog.errors.firstNameMissing
						} else {
							this.createAuthorDialogFirstNameError =
								this.locale.createAuthorDialog.errors.firstNameTooShort
						}
						break
					case ErrorCodes.lastNameTooShort:
						if (this.createAuthorDialogLastName.length == 0) {
							this.createAuthorDialogLastNameError =
								this.locale.createAuthorDialog.errors.lastNameMissing
						} else {
							this.createAuthorDialogLastNameError =
								this.locale.createAuthorDialog.errors.lastNameTooShort
						}
						break
					case ErrorCodes.firstNameTooLong:
						this.createAuthorDialogFirstNameError =
							this.locale.createAuthorDialog.errors.firstNameTooLong
						break
					case ErrorCodes.lastNameTooLong:
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
