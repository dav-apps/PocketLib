import { Component, ViewChild, ElementRef, HostListener } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { MatSnackBar } from '@angular/material/snack-bar'
import { IButtonStyles, IDialogContentProps } from 'office-ui-fabric-react'
import { ApiResponse, DownloadTableObject } from 'dav-js'
import { DataService } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { RoutingService } from 'src/app/services/routing-service'
import {
	GetDualScreenSettings,
	UpdateDialogForDualScreenLayout,
	GetElementHeight,
	GetBookStatusByString
} from 'src/app/misc/utils'
import { Author, BookStatus } from 'src/app/misc/types'
import { environment } from 'src/environments/environment'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-store-book-page',
	templateUrl: './store-book-page.component.html'
})
export class StoreBookPageComponent {
	@ViewChild('container', { static: false }) container: ElementRef<HTMLDivElement>
	locale = enUS.storeBookPage
	width: number = 500
	showMobileLayout: boolean = false
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	uuid: string
	book: {
		collection: string,
		title: string,
		description: string,
		price: number,
		status: BookStatus,
		coverBlurhash: string,
		categories: {
			key: string,
			name: string
		}[],
		inLibrary: boolean,
		purchased: boolean
	} = {
			collection: "",
			title: "",
			description: "",
			price: 0,
			status: BookStatus.Unpublished,
			coverBlurhash: null,
			categories: [],
			inLibrary: false,
			purchased: false
		}
	price: string = ""
	bookStatus: string = ""
	author: Author = {
		uuid: "",
		firstName: "",
		lastName: "",
		websiteUrl: null,
		facebookUsername: null,
		instagramUsername: null,
		twitterUsername: null,
		bios: [],
		collections: [],
		profileImage: false,
		profileImageBlurhash: null
	}
	coverContent: string
	coverAlt: string = ""
	authorProfileImageContent: string = this.dataService.defaultProfileImageUrl
	authorProfileImageAlt: string = ""
	addToLibraryButtonDisabled: boolean = false
	davProRequiredDialogVisible: boolean = false
	buyBookDialogVisible: boolean = false
	buyBookDialogLoginRequired: boolean = false
	errorDialogVisible: boolean = false
	backButtonLink: string = ""
	backButtonLinkParams: { [key: string]: any } = {}

	dialogPrimaryButtonStyles: IButtonStyles = {
		root: {
			marginLeft: 10
		}
	}
	davProRequiredDialogContentProps: IDialogContentProps = {
		title: this.locale.davProRequiredDialog.title
	}
	buyBookDialogContentProps: IDialogContentProps = {
		title: this.locale.buyBookDialog.title
	}
	errorDialogContentProps: IDialogContentProps = {
		title: this.locale.errorDialog.title
	}

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private routingService: RoutingService,
		private snackBar: MatSnackBar,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().storeBookPage

		// Check if this is a dual-screen device with a vertical fold
		let dualScreenSettings = GetDualScreenSettings()
		this.dualScreenLayout = dualScreenSettings.dualScreenLayout
		this.dualScreenFoldMargin = dualScreenSettings.dualScreenFoldMargin

		// Get the uuid from the params
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid')
	}

	async ngOnInit() {
		this.setSize()
		await this.dataService.userPromiseHolder.AwaitResult()

		// Set the link of the back button
		let lastVisitedRoute = this.routingService.GetLastVisitedRoute("/store")
		this.backButtonLink = lastVisitedRoute.url
		this.backButtonLinkParams = lastVisitedRoute.params

		// Get the store book cover
		let coverResponse = await this.apiService.GetStoreBookCover({ uuid: this.uuid })
		if (coverResponse.status == 200) this.coverContent = (coverResponse as ApiResponse<any>).data

		// Get StoreBook, StoreBookCollection and Author
		await this.GetData()
	}

	ngAfterViewInit() {
		this.setSize()
	}

	@HostListener('window:resize')
	setSize() {
		this.width = window.innerWidth
		this.showMobileLayout = window.innerWidth < 768 && !this.dualScreenLayout
		if (this.container) this.dataService.storePageContentHeight = GetElementHeight(this.container.nativeElement)
	}

	BackButtonClick() {
		this.routingService.RevertLastNavigation()
	}

	ShowErrorDialog() {
		this.errorDialogContentProps.title = this.locale.errorDialog.title
		this.errorDialogVisible = true

		if (this.dualScreenLayout) {
			UpdateDialogForDualScreenLayout()
		}
	}

	async GetData() {
		// Get the StoreBook
		let collectionUuid = await this.GetStoreBook()
		setTimeout(() => this.setSize(), 1)
		if (!collectionUuid) return

		// Get the StoreBookCollection
		let authorUuid = await this.GetStoreBookCollection(collectionUuid)
		if (!authorUuid) return

		// Get the Author
		await this.GetAuthor(authorUuid)
	}

	async GetStoreBook(): Promise<string> {
		let response = await this.apiService.GetStoreBook({
			uuid: this.uuid
		})

		if (response.status == 200) {
			let responseData = (response as ApiResponse<any>).data

			this.book.collection = responseData.collection
			this.book.title = responseData.title
			this.book.description = responseData.description
			this.book.price = responseData.price
			this.book.status = GetBookStatusByString(responseData.status)
			this.book.coverBlurhash = responseData.cover_blurhash
			this.book.inLibrary = responseData.in_library
			this.book.purchased = responseData.purchased
			this.coverAlt = this.dataService.GetLocale().misc.bookCoverAlt.replace('{0}', this.book.title)

			this.addToLibraryButtonDisabled = this.book.inLibrary

			// Load the price
			if (this.book.price == 0) {
				this.price = this.locale.free
			} else {
				this.price = (this.book.price / 100).toFixed(2) + " €"

				if (this.dataService.supportedLocale == "de") {
					this.price = this.price.replace('.', ',')
				}
			}

			// Load the status
			switch (this.book.status) {
				case BookStatus.Unpublished:
					this.bookStatus = this.locale.unpublished
					break
				case BookStatus.Review:
					this.bookStatus = this.locale.review
					break
				case BookStatus.Hidden:
					this.bookStatus = this.locale.hidden
					break
			}

			// Load the categories
			await this.dataService.categoriesPromiseHolder.AwaitResult()
			for (let key of responseData.categories) {
				// Find the category with the key
				let category = this.dataService.categories.find(c => c.key == key)

				if (category) {
					this.book.categories.push({
						key: category.key,
						name: category.name
					})
				}
			}

			return responseData.collection
		}

		return null
	}

	async GetStoreBookCollection(uuid: string): Promise<string> {
		let response = await this.apiService.GetStoreBookCollection({
			uuid
		})

		if (response.status == 200) {
			return (response as ApiResponse<any>).data.author
		}

		return null
	}

	async GetAuthor(uuid: string) {
		let response = await this.apiService.GetAuthor({ uuid })

		if (response.status == 200) {
			let responseData = (response as ApiResponse<any>).data
			this.author.uuid = responseData.uuid
			this.author.firstName = responseData.first_name
			this.author.lastName = responseData.last_name
			this.author.bios = responseData.bios
			this.author.collections = responseData.collections
			this.author.profileImage = responseData.profile_image
			this.author.profileImageBlurhash = responseData.profile_image_blurhash
			this.authorProfileImageAlt = this.dataService.GetLocale().misc.authorProfileImageAlt.replace('{0}', `${this.author.firstName} ${this.author.lastName}`)

			if (this.author.profileImage) {
				let profileImageResponse = await this.apiService.GetProfileImageOfAuthor({ uuid: this.author.uuid })
				if (profileImageResponse.status == 200) this.authorProfileImageContent = (profileImageResponse as ApiResponse<any>).data
			}
		}
	}

	async AddToLibrary() {
		// Check if the user can add the book to the library
		let isAuthorOfBook = false
		if (this.dataService.userAuthor) {
			// Try to find the book in the books of the author
			isAuthorOfBook = this.dataService.userAuthor.collections.findIndex(collection => collection.uuid == this.book.collection) != -1
		}

		if (
			!this.dataService.userIsAdmin
			&& !isAuthorOfBook
			&& (this.book.price > 0 && this.dataService.dav.user.Plan != 2)
		) {
			// Show dav Pro dialog
			this.davProRequiredDialogContentProps.title = this.locale.davProRequiredDialog.title
			this.davProRequiredDialogVisible = true

			if (this.dualScreenLayout) {
				UpdateDialogForDualScreenLayout()
			}
			return
		}

		// Add the StoreBook to the library of the user
		let response = await this.apiService.CreateBook({
			storeBook: this.uuid
		})

		if (response.status == 201) {
			let responseData = (response as ApiResponse<any>).data
			this.addToLibraryButtonDisabled = true

			// Show Snackbar
			this.snackBar.open(this.locale.snackbarMessageAdded, null, { duration: 5000 })

			if (this.dataService.smallWindow) {
				// Move the snackbar above the bottom toolbar
				setTimeout(() => {
					let snackbarOverlay = document.getElementById("cdk-overlay-0")
					snackbarOverlay.style.marginBottom = "56px"
				}, 1)
			}

			// Download the table objects
			await DownloadTableObject(responseData.uuid)
			await DownloadTableObject(responseData.file)

			// Clear the ApiCache for GetStoreBook
			this.apiService.ClearCache(this.apiService.GetStoreBook.name)
		} else {
			// Show error
			this.ShowErrorDialog()
		}
	}

	async BuyBook() {
		if (this.dataService.dav.isLoggedIn) {
			if (this.book.price == 0) {
				// Purchase this book directly
				let createPurchaseResponse = await this.apiService.CreatePurchaseForStoreBook({
					uuid: this.uuid,
					currency: "eur"
				})

				if (createPurchaseResponse.status == 201) {
					this.book.purchased = true

					// Clear the ApiCache for GetStoreBook
					this.apiService.ClearCache(this.apiService.GetStoreBook.name)
				} else {
					// Show error
					this.ShowErrorDialog()
				}
			} else {
				// Show dialog for buying the book
				this.ShowBuyBookDialog(false)
			}
		} else {
			// Show the Buy book dialog with login required
			this.ShowBuyBookDialog(true)
		}
	}

	ShowBuyBookDialog(loginRequired: boolean) {
		this.buyBookDialogContentProps.title = this.book.price == 0 ? this.locale.buyBookDialog.loginRequired.titleFree : this.locale.buyBookDialog.title
		this.buyBookDialogLoginRequired = loginRequired
		this.buyBookDialogVisible = true

		if (this.dualScreenLayout) {
			UpdateDialogForDualScreenLayout()
		}
	}

	NavigateToAccountPage() {
		this.router.navigate(['account'], { queryParams: { redirect: `store/book/${this.uuid}` } })
	}

	async NavigateToPurchasePage() {
		// Create the purchase on the server
		let createPurchaseResponse = await this.apiService.CreatePurchaseForStoreBook({
			uuid: this.uuid,
			currency: "eur"
		})
		this.buyBookDialogVisible = false

		if (createPurchaseResponse.status == 201) {
			// Navigate to the purchase page on the website
			let url = environment.baseUrl + this.router.url
			let purchaseUuid = (createPurchaseResponse as ApiResponse<any>).data.uuid

			window.location.href = `${environment.websiteBaseUrl}/purchase/${purchaseUuid}?redirectUrl=${url}`
		} else {
			// Show error
			this.ShowErrorDialog()
		}
	}

	async PublishStoreBook() {
		let response = await this.apiService.UpdateStoreBook({
			uuid: this.uuid,
			status: "published"
		})
		if (response.status == 200) this.book.status = BookStatus.Published

		// Clear the ApiCache for GetStoreBook and GetStoreBooksInReview
		this.apiService.ClearCache(this.apiService.GetStoreBook.name)
		this.apiService.ClearCache(this.apiService.GetStoreBooksInReview.name)
	}
}