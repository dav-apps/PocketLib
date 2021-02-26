import { Component, HostListener } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { IButtonStyles, IDialogContentProps } from 'office-ui-fabric-react'
import { faCoins, faHandHoldingUsd } from '@fortawesome/free-solid-svg-icons'
import { ApiResponse } from 'dav-npm'
import { DataService } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import * as ErrorCodes from 'src/constants/errorCodes'
import { enUS } from 'src/locales/locales'

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
	uuid: string
	createAuthorDialogVisible: boolean = false
	createAuthorDialogFirstName: string = ""
	createAuthorDialogLastName: string = ""
	createAuthorDialogFirstNameError: string = ""
	createAuthorDialogLastNameError: string = ""
	booksInReview: {
		uuid: string,
		title: string
	}[] = []

	dialogPrimaryButtonStyles: IButtonStyles = {
		root: {
			marginLeft: 10
		}
	}
	createAuthorDialogContentProps: IDialogContentProps = {
		title: this.locale.createAuthorDialog.title
	}

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().authorPage

		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid')
	}

	async ngOnInit() {
		this.setSize()

		await this.dataService.userPromiseHolder.AwaitResult()
		if (this.dataService.userIsAdmin && !this.uuid) {
			// Get the books in review
			let response: ApiResponse<any> = await this.apiService.GetStoreBooksInReview()

			if (response.status == 200) {
				this.booksInReview = []

				for (let book of response.data.books) {
					this.booksInReview.push({
						uuid: book.uuid,
						title: book.title
					})
				}
			}
		}
	}

	@HostListener('window:resize')
	onResize() {
		this.setSize()
	}

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

		this.createAuthorDialogContentProps.title = this.locale.createAuthorDialog.title
		this.createAuthorDialogVisible = true
	}

	ShowBook(uuid: string) {
		this.router.navigate(["store", "book", uuid])
	}

	async CreateAuthor() {
		this.createAuthorDialogFirstNameError = ""
		this.createAuthorDialogLastNameError = ""

		let response: ApiResponse<any> = await this.apiService.CreateAuthor({
			firstName: this.createAuthorDialogFirstName,
			lastName: this.createAuthorDialogLastName
		})

		if (response.status == 201) {
			// Add the author to the admin authors in DataService
			this.dataService.adminAuthors.push({
				uuid: response.data.uuid,
				firstName: response.data.first_name,
				lastName: response.data.last_name,
				websiteUrl: response.data.website_url,
				facebookUsername: response.data.facebook_username,
				instagramUsername: response.data.instagram_username,
				twitterUsername: response.data.twitter_username,
				bios: response.data.bios,
				collections: response.data.collections,
				profileImage: response.data.profile_image,
				profileImageBlurhash: response.data.profile_image_blurhash
			})

			this.createAuthorDialogVisible = false

			// Redirect to the author page of the new author
			this.router.navigate(['author', response.data.uuid])
		} else {
			for (let error of response.data.errors) {
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