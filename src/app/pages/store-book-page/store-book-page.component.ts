import { Component, HostListener } from '@angular/core'
import { Router, ActivatedRoute, ParamMap } from '@angular/router'
import { ApiResponse, DownloadTableObject } from 'dav-js'
import { DataService } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { CachingService } from 'src/app/services/caching-service'
import { RoutingService } from 'src/app/services/routing-service'
import { EpubBook } from 'src/app/models/EpubBook'
import { PdfBook } from 'src/app/models/PdfBook'
import { GetDualScreenSettings, GetBookStatusByString } from 'src/app/misc/utils'
import { Author, BookStatus } from 'src/app/misc/types'
import { environment } from 'src/environments/environment'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-store-book-page',
	templateUrl: './store-book-page.component.html'
})
export class StoreBookPageComponent {
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
		purchased: boolean,
		series: string[]
	} = {
			collection: "",
			title: "",
			description: "",
			price: 0,
			status: BookStatus.Unpublished,
			coverBlurhash: null,
			categories: [],
			inLibrary: false,
			purchased: false,
			series: []
		}
	categoryKeys: string[] = []
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
		series: [],
		profileImage: false,
		profileImageBlurhash: null
	}
	coverContent: string
	coverAlt: string = ""
	authorProfileImageContent: string = this.dataService.defaultProfileImageUrl
	authorProfileImageAlt: string = ""
	loginRequiredDialogVisible: boolean = false
	davProRequiredDialogVisible: boolean = false
	buyBookDialogVisible: boolean = false
	buyBookDialogLoginRequired: boolean = false
	errorDialogVisible: boolean = false
	loadingScreenVisible: boolean = false

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private cachingService: CachingService,
		private routingService: RoutingService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().storeBookPage

		// Check if this is a dual-screen device with a vertical fold
		let dualScreenSettings = GetDualScreenSettings()
		this.dualScreenLayout = dualScreenSettings.dualScreenLayout
		this.dualScreenFoldMargin = dualScreenSettings.dualScreenFoldMargin
	}

	async ngOnInit() {
		this.setSize()
		await this.dataService.userPromiseHolder.AwaitResult()

		// Get the uuid from the params
		this.activatedRoute.paramMap.subscribe((paramMap: ParamMap) => {
			let uuid = paramMap.get("uuid")

			if (this.uuid != uuid) {
				this.uuid = uuid
				this.Init()
			}
		})
	}

	ngAfterViewInit() {
		this.setSize()
	}

	@HostListener('window:resize')
	setSize() {
		this.width = window.innerWidth
		this.showMobileLayout = window.innerWidth < 768 && !this.dualScreenLayout
	}

	async Init() {
		// Scroll to the top of the page
		this.dataService.ScrollStoreContentToTop()

		// Get the store book cover
		let coverResponse = await this.apiService.GetStoreBookCover({ uuid: this.uuid })
		if (coverResponse.status == 200) this.coverContent = (coverResponse as ApiResponse<any>).data

		// Get StoreBook, StoreBookCollection and Author
		await this.GetData()
	}

	BackButtonClick() {
		this.routingService.NavigateBack("/store")
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
			this.book.series = responseData.series
			this.categoryKeys = responseData.categories
			this.coverAlt = this.dataService.GetLocale().misc.bookCoverAlt.replace('{0}', this.book.title)

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
			this.book.categories = []
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

	async Read() {
		// Check if the user is logged in
		if (!this.dataService.dav.isLoggedIn) {
			this.loginRequiredDialogVisible = true
			return
		}

		// Check if the book is already in the library of the user
		if (!this.book.inLibrary) {
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
				this.davProRequiredDialogVisible = true
				return
			}

			// Show the loading screen
			this.loadingScreenVisible = true

			// Add the StoreBook to the library of the user
			let response = await this.apiService.CreateBook({
				storeBook: this.uuid
			})

			if (response.status == 201) {
				let responseData = (response as ApiResponse<any>).data

				// Download the table objects
				await DownloadTableObject(responseData.uuid)
				await DownloadTableObject(responseData.file)

				await this.dataService.ReloadBook(responseData.uuid)

				// Clear the ApiCache for GetStoreBook
				this.cachingService.ClearApiRequestCache(this.apiService.GetStoreBook.name)
			} else {
				// Show error
				this.loadingScreenVisible = false
				this.errorDialogVisible = true
				return
			}
		}

		// Load the book
		let book = this.dataService.books.find(b => b.storeBook == this.uuid)
		
		if (book == null) {
			// Show error
			this.loadingScreenVisible = false
			this.errorDialogVisible = true
			return
		}

		this.dataService.currentBook = book

		// Update the settings with the position of the current book
		if (book instanceof EpubBook) {
			await this.dataService.settings.SetBook(book.uuid, book.chapter, book.progress)
		} else if (book instanceof PdfBook) {
			await this.dataService.settings.SetBook(book.uuid, null, book.page)
		}

		this.router.navigate(["book"])
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
					this.cachingService.ClearApiRequestCache(this.apiService.GetStoreBook.name)
				} else {
					// Show error
					this.errorDialogVisible = true
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
		this.buyBookDialogLoginRequired = loginRequired
		this.buyBookDialogVisible = true
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
			this.errorDialogVisible = true
		}
	}

	async PublishStoreBook() {
		let response = await this.apiService.UpdateStoreBook({
			uuid: this.uuid,
			status: "published"
		})
		if (response.status == 200) this.book.status = BookStatus.Published

		// Clear the ApiCache for GetStoreBook and GetStoreBooksInReview
		this.cachingService.ClearApiRequestCache(this.apiService.GetStoreBook.name)
		this.cachingService.ClearApiRequestCache(this.apiService.GetStoreBooksInReview.name)
	}
}