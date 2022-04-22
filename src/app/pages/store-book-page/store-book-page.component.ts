import { Component, HostListener } from '@angular/core'
import { Router, ActivatedRoute, ParamMap } from '@angular/router'
import { ApiResponse, ApiErrorResponse, DownloadTableObject, isSuccessStatusCode } from 'dav-js'
import { DataService } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { CachingService } from 'src/app/services/caching-service'
import { RoutingService } from 'src/app/services/routing-service'
import { EpubBook } from 'src/app/models/EpubBook'
import { PdfBook } from 'src/app/models/PdfBook'
import { GetDualScreenSettings, GetBookStatusByString } from 'src/app/misc/utils'
import {
	AuthorResource,
	AuthorField,
	BookResource,
	BookField,
	BookStatus,
	PurchaseResource,
	PurchaseField,
	StoreBookCollectionResource,
	StoreBookCollectionField,
	StoreBookResource,
	StoreBookField,
	ListResponseData,
	StoreBookSeriesResource,
	StoreBookSeriesListField
} from 'src/app/misc/types'
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
	author: AuthorResource = {
		uuid: "",
		firstName: "",
		lastName: "",
		bio: null,
		websiteUrl: null,
		facebookUsername: null,
		instagramUsername: null,
		twitterUsername: null,
		profileImage: null
	}
	coverContent: string
	coverAlt: string = ""
	authorProfileImageContent: string = this.dataService.defaultProfileImageUrl
	authorProfileImageAlt: string = ""
	loginRequiredDialogVisible: boolean = false
	noAccessDialogVisible: boolean = false
	buyBookDialogVisible: boolean = false
	buyBookDialogLoginRequired: boolean = false
	errorDialogVisible: boolean = false
	loadingScreenVisible: boolean = false
	publishLoading: boolean = false

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
		let response = await this.apiService.RetrieveStoreBook({
			uuid: this.uuid,
			fields: [
				StoreBookField.collection,
				StoreBookField.title,
				StoreBookField.description,
				StoreBookField.price,
				StoreBookField.status,
				StoreBookField.cover,
				StoreBookField.inLibrary,
				StoreBookField.purchased,
				StoreBookField.categories
			]
		})

		if (isSuccessStatusCode(response.status)) {
			let responseData = (response as ApiResponse<StoreBookResource>).data

			this.book.collection = responseData.collection
			this.book.title = responseData.title
			this.book.description = responseData.description
			this.book.price = responseData.price
			this.book.status = GetBookStatusByString(responseData.status)
			this.book.coverBlurhash = responseData.cover?.blurhash
			this.book.inLibrary = responseData.inLibrary
			this.book.purchased = responseData.purchased
			this.categoryKeys = responseData.categories
			this.coverAlt = this.dataService.GetLocale().misc.bookCoverAlt.replace('{0}', this.book.title)

			// Load the cover
			if (responseData.cover?.url != null) {
				this.apiService.GetFile({ url: responseData.cover.url }).then((fileResponse: ApiResponse<string> | ApiErrorResponse) => {
					if (isSuccessStatusCode(fileResponse.status)) {
						this.coverContent = (fileResponse as ApiResponse<string>).data
					}
				})
			}

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

			for (let key of this.categoryKeys) {
				// Find the category with the key
				let category = this.dataService.categories.find(c => c.key == key)

				if (category) {
					this.book.categories.push({
						key: category.key,
						name: category.name
					})
				}
			}

			// Get the series of the book
			let listSeriesResponse = await this.apiService.ListStoreBookSeries({
				fields: [StoreBookSeriesListField.items_uuid],
				languages: await this.dataService.GetStoreLanguages(),
				storeBook: this.uuid
			})

			if (isSuccessStatusCode(listSeriesResponse.status)) {
				let listSeriesResponseData = (listSeriesResponse as ApiResponse<ListResponseData<StoreBookSeriesResource>>).data

				if (listSeriesResponseData.items.length > 0) {
					this.book.series.push(listSeriesResponseData.items[0].uuid)
				}
			}

			return responseData.collection
		}

		return null
	}

	async GetStoreBookCollection(uuid: string): Promise<string> {
		let response = await this.apiService.RetrieveStoreBookCollection({
			uuid,
			fields: [StoreBookCollectionField.author]
		})

		if (isSuccessStatusCode(response.status)) {
			return (response as ApiResponse<StoreBookCollectionResource>).data.author
		}

		return null
	}

	async GetAuthor(uuid: string) {
		let response = await this.apiService.RetrieveAuthor({
			uuid,
			fields: [
				AuthorField.uuid,
				AuthorField.firstName,
				AuthorField.lastName,
				AuthorField.profileImage
			]
		})

		if (isSuccessStatusCode(response.status)) {
			this.author = (response as ApiResponse<AuthorResource>).data
			this.authorProfileImageAlt = this.dataService.GetLocale().misc.authorProfileImageAlt.replace('{0}', `${this.author.firstName} ${this.author.lastName}`)

			if (this.author.profileImage?.url != null) {
				this.apiService.GetFile({ url: this.author.profileImage.url }).then((fileResponse: ApiResponse<string> | ApiErrorResponse) => {
					if (isSuccessStatusCode(fileResponse.status)) {
						this.authorProfileImageContent = (fileResponse as ApiResponse<string>).data
					}
				})
			}
		}
	}

	async Read() {
		/*
		- is not logged in:
			- Show login dialog
		- is logged in:
			- is in library:
				- open book
			- is not in library:
				- purchased:
					- add to library
					- open book
				- not purchased:
					- free:
						- create purchase for book
						- add to library
						- open book
					- not free:
						- can access:
							- add to library
							- open book
						- can not access
							- show dav Plus dialog

		*/

		// Check if the user is logged in
		if (!this.dataService.dav.isLoggedIn) {
			this.loginRequiredDialogVisible = true
			return
		}

		// Check if the book is in the library of the user
		if (this.book.inLibrary) {
			// TODO: Check if the book is already downloaded, and if not, wait for download
			await this.OpenBook()
		} else {
			this.loadingScreenVisible = true

			// Check if the user has purchased the book
			if (this.book.purchased) {
				if (!await this.AddBookToLibrary()) {
					// Show error
					this.loadingScreenVisible = false
					this.errorDialogVisible = true
					return
				}

				await this.OpenBook()
			} else {
				// Check if the book is free
				if (this.book.price == 0) {
					if (!await this.CreatePurchaseForBook()) {
						// Show error
						this.loadingScreenVisible = false
						this.errorDialogVisible = true
						return
					}

					if (!await this.AddBookToLibrary()) {
						// Show error
						this.loadingScreenVisible = false
						this.errorDialogVisible = true
						return
					}

					await this.OpenBook()
				} else {
					// Check if the user can access the book
					let isAuthorOfBook = false
					if (this.dataService.userAuthor) {
						// Try to find the book in the books of the author
						isAuthorOfBook = (await this.dataService.userAuthor.GetCollections()).findIndex(collection => collection.uuid == this.book.collection) != -1
					}

					if (
						!this.dataService.userIsAdmin
						&& !isAuthorOfBook
						&& (this.book.price > 0 && this.dataService.dav.user.Plan != 2)
					) {
						// Show dav Pro dialog
						this.loadingScreenVisible = false
						this.noAccessDialogVisible = true
						return
					}

					await this.AddBookToLibrary()
					await this.OpenBook()
				}
			}
		}
	}

	private async CreatePurchaseForBook(): Promise<boolean> {
		// Purchase this book directly
		let createPurchaseResponse = await this.apiService.CreatePurchase({
			storeBook: this.uuid,
			currency: "eur"
		})

		if (isSuccessStatusCode(createPurchaseResponse.status)) {
			this.book.purchased = true

			// Clear the ApiCache for GetStoreBook
			this.cachingService.ClearApiRequestCache(this.apiService.RetrieveStoreBook.name)

			return true
		}

		return false
	}

	private async AddBookToLibrary(): Promise<boolean> {
		// Add the StoreBook to the library of the user
		let response = await this.apiService.CreateBook({
			storeBook: this.uuid,
			fields: [BookField.uuid, BookField.file]
		})

		if (isSuccessStatusCode(response.status)) {
			let responseData = (response as ApiResponse<BookResource>).data

			// Download the table objects
			await DownloadTableObject(responseData.uuid)
			await DownloadTableObject(responseData.file)

			await this.dataService.ReloadBook(responseData.uuid)

			// Clear the ApiCache for GetStoreBook
			this.cachingService.ClearApiRequestCache(this.apiService.RetrieveStoreBook.name)

			return true
		} else {
			let error = (response as ApiErrorResponse).errors[0]
			
			if (error.code == 3005) {
				// StoreBook is already in library
				return true
			}
		}

		return false
	}

	private async OpenBook() {
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
			// Show dialog for buying the book
			this.ShowBuyBookDialog(false)
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
		let createPurchaseResponse = await this.apiService.CreatePurchase({
			storeBook: this.uuid,
			currency: "eur",
			fields: [PurchaseField.uuid]
		})
		this.buyBookDialogVisible = false

		if (isSuccessStatusCode(createPurchaseResponse.status)) {
			// Navigate to the purchase page on the website
			let url = environment.baseUrl + this.router.url
			let purchaseUuid = (createPurchaseResponse as ApiResponse<PurchaseResource>).data.uuid

			window.location.href = `${environment.websiteBaseUrl}/purchase/${purchaseUuid}?redirectUrl=${url}`
		} else {
			// Show error
			this.errorDialogVisible = true
		}
	}

	async PublishStoreBook() {
		this.publishLoading = true

		let response = await this.apiService.UpdateStoreBook({
			uuid: this.uuid,
			status: "published"
		})
		if (response.status == 200) this.book.status = BookStatus.Published

		// Clear the ApiCache for GetStoreBook and GetStoreBooksInReview
		this.cachingService.ClearApiRequestCache(this.apiService.RetrieveStoreBook.name)
		this.cachingService.ClearApiRequestCache(this.apiService.ListStoreBooks.name)

		this.publishLoading = false
	}
}