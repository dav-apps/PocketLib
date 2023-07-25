import { Component } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { faPlus as faPlusLight } from "@fortawesome/pro-light-svg-icons"
import { DataService } from "src/app/services/data-service"
import { GraphQLService } from "src/app/services/graphql-service"
import * as ErrorCodes from "src/constants/errorCodes"
import { GetDualScreenSettings } from "src/app/misc/utils"
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
		private graphqlService: GraphQLService,
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

		let response = await this.graphqlService.createPublisher(
			`
				uuid
				name
			`,
			{
				name: this.createPublisherDialogName
			}
		)

		this.createPublisherDialogLoading = false

		if (response.errors == null) {
			let responseData = response.data.createPublisher

			// Add the publisher to the publishers of the admin in DataService
			this.dataService.adminPublishers.push(
				new Publisher(
					responseData,
					await this.dataService.GetStoreLanguages(),
					this.graphqlService
				)
			)

			// Redirect to the publisher page of the new publisher
			this.router.navigate(["publisher", responseData.uuid])
		} else {
			let errors = response.errors[0].extensions.errors as string[]

			for (let errorCode of errors) {
				switch (errorCode) {
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

		let response = await this.graphqlService.createAuthor(
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
				new Author(
					responseData,
					await this.dataService.GetStoreLanguages(),
					this.graphqlService
				)
			)

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
