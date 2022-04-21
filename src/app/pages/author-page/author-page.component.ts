import { Component, HostListener } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { faCoins, faHandHoldingUsd } from '@fortawesome/free-solid-svg-icons'
import { ApiErrorResponse, ApiResponse, isSuccessStatusCode } from 'dav-js'
import { DataService } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { CachingService } from 'src/app/services/caching-service'
import * as ErrorCodes from 'src/constants/errorCodes'
import { GetDualScreenSettings } from 'src/app/misc/utils'
import { enUS } from 'src/locales/locales'
import {
	AuthorField,
	AuthorResource,
	ListResponseData,
	StoreBookListField,
	StoreBookResource
} from 'src/app/misc/types'
import { Author } from 'src/app/models/Author'

@Component({
	selector: "pocketlib-author-page",
	templateUrl: "./author-page.component.html",
	styleUrls: [
		'./author-page.component.scss'
	]
})
export class AuthorPageComponent {
	locale = enUS.authorPage
	faCoins = faCoins
	faHandHoldingUsd = faHandHoldingUsd
	section1Height: number = 600
	section1TextMarginTop: number = 200
	section2Height: number = 600
	section3Height: number = 400
	authorSampleProfileImageWidth: number = 392
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	uuid: string
	createAuthorDialogVisible: boolean = false
	createAuthorDialogLoading: boolean = false
	createAuthorDialogFirstName: string = ""
	createAuthorDialogLastName: string = ""
	createAuthorDialogFirstNameError: string = ""
	createAuthorDialogLastNameError: string = ""
	booksInReview: {
		uuid: string,
		title: string
	}[] = []

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
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
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid')
	}

	async ngOnInit() {
		this.setSize()

		await this.dataService.userPromiseHolder.AwaitResult()

		if (this.dataService.userIsAdmin && !this.uuid) {
			// Get the books in review
			let listStoreBooksResponse = await this.apiService.ListStoreBooks({
				review: true,
				fields: [
					StoreBookListField.items_uuid,
					StoreBookListField.items_title
				],
				languages: await this.dataService.GetStoreLanguages()
			})

			if (isSuccessStatusCode(listStoreBooksResponse.status)) {
				let listStoreBooksResponseData = (listStoreBooksResponse as ApiResponse<ListResponseData<StoreBookResource>>).data
				this.booksInReview = []

				for (let book of listStoreBooksResponseData.items) {
					this.booksInReview.push({
						uuid: book.uuid,
						title: book.title
					})
				}
			}
		}
	}

	@HostListener('window:resize')
	setSize() {
		let navbarHeight = window.innerWidth < 600 ? 56 : 64
		this.section1Height = window.innerHeight - navbarHeight
		this.section1TextMarginTop = this.section1Height * 0.36

		if (window.innerWidth < 600) {
			// Small width
			this.section2Height = 850
			this.section3Height = 500
		} else if (window.innerWidth < 768) {
			// Medium width
			this.section2Height = 800
			this.section3Height = 450
		} else {
			// Large width
			this.section2Height = 600
			this.section3Height = 400
		}

		if (window.innerWidth < 980 && window.innerWidth >= 768) {
			this.authorSampleProfileImageWidth = 350
		} else {
			this.authorSampleProfileImageWidth = 392
		}
	}

	createProfileButtonClick() {
		if (this.dataService.dav.isLoggedIn) {
			// Redirect to the Author setup page
			this.router.navigate(['author', 'setup'])
		} else {
			// Redirect to the Account page
			this.router.navigate(["account"], {
				queryParams: {
					redirect: "author/setup"
				}
			})
		}
	}

	ShowAuthor(uuid: string) {
		this.router.navigate(['author', uuid])
	}

	ShowCreateAuthorDialog() {
		this.createAuthorDialogFirstName = ""
		this.createAuthorDialogFirstNameError = ""
		this.createAuthorDialogLastName = ""
		this.createAuthorDialogLastNameError = ""
		this.createAuthorDialogVisible = true
		this.createAuthorDialogLoading = false
	}

	ShowBook(uuid: string) {
		this.router.navigate(["store", "book", uuid])
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
					this.cachingService
				)
			)

			this.createAuthorDialogVisible = false

			// Redirect to the author page of the new author
			this.router.navigate(['author', responseData.uuid])
		} else {
			for (let error of (response as ApiErrorResponse).errors) {
				switch (error.code) {
					case ErrorCodes.FirstNameMissing:
						this.createAuthorDialogFirstNameError = this.locale.createAuthorDialog.errors.firstNameMissing
						break
					case ErrorCodes.LastNameMissing:
						this.createAuthorDialogLastNameError = this.locale.createAuthorDialog.errors.lastNameMissing
						break
					case ErrorCodes.FirstNameTooShort:
						this.createAuthorDialogFirstNameError = this.locale.createAuthorDialog.errors.firstNameTooShort
						break
					case ErrorCodes.LastNameTooShort:
						this.createAuthorDialogLastNameError = this.locale.createAuthorDialog.errors.lastNameTooShort
						break
					case ErrorCodes.FirstNameTooLong:
						this.createAuthorDialogFirstNameError = this.locale.createAuthorDialog.errors.firstNameTooLong
						break
					case ErrorCodes.LastNameTooLong:
						this.createAuthorDialogLastNameError = this.locale.createAuthorDialog.errors.lastNameTooLong
						break
					default:
						this.createAuthorDialogFirstNameError = this.locale.createAuthorDialog.errors.unexpectedError
						break
				}
			}
		}
	}
}