import { Component } from "@angular/core"
import { Router, ActivatedRoute, ParamMap } from "@angular/router"
import {
	CheckoutSessionsController,
	CreateCheckoutSessionResponseData,
	DownloadTableObject,
	isSuccessStatusCode
} from "dav-js"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { RoutingService } from "src/app/services/routing-service"
import { EpubBook } from "src/app/models/EpubBook"
import { PdfBook } from "src/app/models/PdfBook"
import { UpdateBookOrder } from "src/app/models/BookOrder"
import { GetBook } from "src/app/models/BookManager"
import { GetStoreBookStatusByString } from "src/app/misc/utils"
import { ApiResponse, StoreBookStatus } from "src/app/misc/types"
import { enUS } from "src/locales/locales"

@Component({
	selector: "pocketlib-store-book-page",
	templateUrl: "./store-book-page.component.html",
	styleUrls: ["./store-book-page.component.scss"]
})
export class StoreBookPageComponent {
	locale = enUS.storeBookPage

	//#region StoreBook variables
	uuid: string = ""
	title: string = ""
	description: string = ""
	price: number = 0
	priceLabel: string = ""
	status: StoreBookStatus = StoreBookStatus.Unpublished
	statusLabel: string = ""
	categoryKeys: string[] = []
	categories: {
		key: string
		name: string
	}[] = []
	inLibrary: boolean = false
	purchased: boolean = false
	collectionUuid: string = null
	seriesUuid: string = null
	seriesHeadline: string = ""
	moreBooksHeadline: string = ""
	//#endregion

	//#region Cover variables
	coverContent: string = this.dataService.defaultStoreBookCover
	coverUrl: string = ""
	coverBlurhash: string = ""
	coverAlt: string = ""
	coverHeight = 270
	coverWidth = 180
	//#endregion

	//#region Author variables
	authorUuid: string = ""
	authorName: string = ""
	authorProfileImageContent: string = this.dataService.defaultProfileImageUrl
	authorProfileImageBlurhash: string = ""
	authorProfileImageAlt: string = ""
	//#endregion

	//#region Publisher variables
	publisherUuid: string = ""
	publisherName: string = ""
	publisherLogoContent: string = this.dataService.defaultProfileImageUrl
	publisherLogoBlurhash: string = ""
	publisherLogoAlt: string = ""
	//#endregion

	//#region Dialog variables
	loginRequiredDialogVisible: boolean = false
	noAccessDialogVisible: boolean = false
	buyBookDialogVisible: boolean = false
	buyBookDialogLoginRequired: boolean = false
	errorDialogVisible: boolean = false
	publishLoading: boolean = false
	//#endregion

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private routingService: RoutingService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().storeBookPage
	}

	async ngOnInit() {
		await this.dataService.userPromiseHolder.AwaitResult()

		// Get the uuid from the params
		this.activatedRoute.paramMap.subscribe(async (paramMap: ParamMap) => {
			let uuid = paramMap.get("uuid")

			if (this.uuid != uuid) {
				this.uuid = uuid

				// Show the loading screen & scroll to the top
				this.dataService.simpleLoadingScreenVisible = true
				this.dataService.contentContainer.scrollTo(0, 0)

				// Load the data of the new StoreBook
				await this.Init()
			}
		})
	}

	async Init() {
		// Get StoreBook, StoreBookCollection and Author
		await this.LoadStoreBookData()
	}

	BackButtonClick() {
		this.routingService.NavigateBack("/store")
	}

	async LoadStoreBookData() {
		let response = await this.apiService.retrieveStoreBook(
			`
				collection {
					uuid
					author {
						uuid
						publisher {
							uuid
							name
							logo {
								url
								blurhash
							}
						}
						firstName
						lastName
						profileImage {
							url
							blurhash
						}
					}
				}
				title
				description
				price
				status
				cover {
					url
					blurhash
					aspectRatio
				}
				inLibrary
				purchased
				categories {
					items {
						key
					}
				}
				series {
					items {
						uuid
						name
					}
				}
			`,
			{ uuid: this.uuid }
		)

		let responseData = response.data.retrieveStoreBook
		this.dataService.simpleLoadingScreenVisible = false

		this.title = responseData.title
		this.description = responseData.description
		this.price = responseData.price
		this.status = GetStoreBookStatusByString(responseData.status)
		this.inLibrary = responseData.inLibrary
		this.purchased = responseData.purchased
		this.categoryKeys = []

		for (let category of responseData.categories.items) {
			this.categoryKeys.push(category.key)
		}

		let cover = responseData.cover

		if (cover != null) {
			this.coverUrl = cover.url
			this.coverBlurhash = cover.blurhash

			this.coverAlt = this.dataService
				.GetLocale()
				.misc.bookCoverAlt.replace("{0}", this.title)

			this.apiService
				.downloadFile(this.coverUrl)
				.then((fileResponse: ApiResponse<string>) => {
					if (isSuccessStatusCode(fileResponse.status)) {
						this.coverContent = (fileResponse as ApiResponse<string>).data
					}
				})

			// Set width & height of the cover using the aspect ratio
			let aspectRatio = cover.aspectRatio

			if (aspectRatio != null) {
				let aspectRatioParts = aspectRatio.split(":")

				if (aspectRatioParts.length == 2) {
					let xValue = +aspectRatioParts[0]
					let yValue = +aspectRatioParts[1]

					setTimeout(() => {
						if (yValue > xValue) {
							this.coverHeight = this.coverWidth * yValue
						} else if (xValue == yValue) {
							this.coverHeight = this.coverWidth
						}
					}, 1)
				}
			}
		}

		// Load the price
		if (this.price == 0) {
			this.priceLabel = this.locale.free
		} else {
			this.priceLabel = (this.price / 100).toFixed(2) + " €"

			if (this.dataService.supportedLocale == "de") {
				this.priceLabel = this.priceLabel.replace(".", ",")
			}
		}

		// Load the status
		switch (this.status) {
			case StoreBookStatus.Unpublished:
				this.statusLabel = this.locale.unpublished
				break
			case StoreBookStatus.Review:
				this.statusLabel = this.locale.review
				break
			case StoreBookStatus.Hidden:
				this.statusLabel = this.locale.hidden
				break
		}

		// Load the categories
		this.categories = []
		await this.dataService.categoriesPromiseHolder.AwaitResult()

		for (let key of this.categoryKeys) {
			// Find the category with the key
			let category = this.dataService.categories.find(c => c.key == key)

			if (category) {
				this.categories.push({
					key: category.key,
					name: category.name
				})
			}
		}

		this.moreBooksHeadline =
			this.categories.length == 1
				? this.locale.moreBooksInCategory
				: this.locale.moreBooksInCategories

		// Get the series of the book
		if (responseData.series.items.length > 0) {
			this.seriesUuid = responseData.series.items[0].uuid
			this.seriesHeadline = this.locale.moreOfSeries.replace(
				"{0}",
				responseData.series.items[0].name
			)
		} else {
			this.seriesUuid = null
			this.seriesHeadline = ""
		}

		let author = responseData.collection.author
		this.authorUuid = author.uuid
		this.authorName = `${author.firstName} ${author.lastName}`
		this.authorProfileImageBlurhash = author.profileImage?.blurhash

		this.authorProfileImageAlt = this.dataService
			.GetLocale()
			.misc.authorProfileImageAlt.replace("{0}", this.authorName)

		let authorProfileImageUrl = author.profileImage?.url

		if (authorProfileImageUrl != null) {
			this.apiService
				.downloadFile(authorProfileImageUrl)
				.then((fileResponse: ApiResponse<string>) => {
					if (isSuccessStatusCode(fileResponse.status)) {
						this.authorProfileImageContent = (
							fileResponse as ApiResponse<string>
						).data
					}
				})
		}

		let publisher = responseData.collection.author.publisher

		if (publisher != null) {
			this.publisherUuid = publisher.uuid
			this.publisherName = publisher.name
			this.publisherLogoBlurhash = publisher.logo?.blurhash
			this.publisherLogoAlt = this.dataService
				.GetLocale()
				.misc.publisherLogoAlt.replace("{0}", this.publisherName)

			let publisherLogoUrl = publisher.logo?.url

			if (publisherLogoUrl != null) {
				this.apiService
					.downloadFile(publisherLogoUrl)
					.then((response: ApiResponse<string>) => {
						if (isSuccessStatusCode(response.status))
							this.publisherLogoContent = (
								response as ApiResponse<string>
							).data
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
		if (this.inLibrary) {
			// TODO: Check if the book is already downloaded, and if not, wait for download
			await this.OpenBook()
		} else {
			this.dataService.loadingScreenVisible = true

			// Check if the user has purchased the book
			if (this.purchased) {
				if (!(await this.AddBookToLibrary())) {
					// Show error
					this.dataService.loadingScreenVisible = false
					this.errorDialogVisible = true
					return
				}

				await this.OpenBook()
			} else {
				// Check if the book is free
				if (this.price == 0) {
					if (!(await this.CreatePurchaseForBook())) {
						// Show error
						this.dataService.loadingScreenVisible = false
						this.errorDialogVisible = true
						return
					}

					if (!(await this.AddBookToLibrary())) {
						// Show error
						this.dataService.loadingScreenVisible = false
						this.errorDialogVisible = true
						return
					}

					await this.OpenBook()
				} else {
					// Check if the user can access the book
					let isAuthorOfBook = false

					if (this.dataService.userAuthor) {
						// Try to find the book in the books of the author
						isAuthorOfBook =
							(
								await this.dataService.userAuthor.GetCollections()
							).items.findIndex(c => c.uuid == this.collectionUuid) != -1
					}

					if (
						!this.dataService.userIsAdmin &&
						!isAuthorOfBook &&
						this.price > 0 &&
						this.dataService.dav.user.Plan != 2
					) {
						// Show dav Pro dialog
						this.dataService.loadingScreenVisible = false
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
		let currentUrl = window.location.origin + this.router.url

		let response = await CheckoutSessionsController.CreateCheckoutSession({
			mode: "payment",
			currency: "eur",
			productName: this.title,
			productImage: this.coverUrl,
			tableObjects: [this.uuid],
			successUrl: currentUrl,
			cancelUrl: currentUrl
		})

		if (isSuccessStatusCode(response.status)) {
			this.purchased = true
			return true
		}

		return false
	}

	private async AddBookToLibrary(): Promise<boolean> {
		// Add the StoreBook to the library of the user
		let response = await this.apiService.createBook(
			`
				uuid
				file
			`,
			{ storeBook: this.uuid }
		)

		if (response.errors == null) {
			let responseData = response.data.createBook

			// Download the table objects
			await DownloadTableObject(responseData.uuid)
			await DownloadTableObject(responseData.file)

			let book = await GetBook(responseData.uuid)

			if (book != null) {
				// Add the new book to the first position of the books
				this.dataService.books.unshift(book)

				// Update the order of the books
				await UpdateBookOrder(
					this.dataService.bookOrder,
					this.dataService.books
				)
			}

			return true
		} else {
			let error = response.errors[0].extensions.code as string

			if (error == "STORE_BOOK_ALREADY_IN_LIBRARY") {
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
			this.dataService.loadingScreenVisible = false
			this.errorDialogVisible = true
			return
		}

		this.dataService.currentBook = book

		// Update the settings with the position of the current book
		if (book instanceof EpubBook) {
			await this.dataService.settings.SetBook(
				book.uuid,
				book.chapter,
				book.progress
			)
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
		this.router.navigate(["account"], {
			queryParams: { redirect: `store/book/${this.uuid}` }
		})
	}

	async NavigateToPurchasePage() {
		let currentUrl = window.location.origin + this.router.url

		let response = await CheckoutSessionsController.CreateCheckoutSession({
			mode: "payment",
			currency: "eur",
			productName: this.title,
			productImage: this.coverUrl,
			tableObjects: [this.uuid],
			successUrl: currentUrl,
			cancelUrl: currentUrl
		})

		if (isSuccessStatusCode(response.status)) {
			// Navigate to the checkout session url
			let responseData = (
				response as ApiResponse<CreateCheckoutSessionResponseData>
			).data
			window.location.href = responseData.sessionUrl
		} else {
			// Show error
			this.buyBookDialogVisible = false
			this.errorDialogVisible = true
		}
	}

	async PublishStoreBook() {
		this.publishLoading = true

		let response = await this.apiService.updateStoreBook(`uuid`, {
			uuid: this.uuid,
			status: "published"
		})

		if (response.errors == null) {
			this.status = StoreBookStatus.Published

			// Find the author and clear the collections
			if (this.dataService.userIsAdmin) {
				let author = this.dataService.adminAuthors.find(
					a => a.uuid == this.authorUuid
				)

				if (author != null) {
					//author.ClearCollections()
				}
			} else if (this.dataService.userAuthor?.uuid == this.authorUuid) {
				//this.dataService.userAuthor.ClearCollections()
			}
		}

		this.publishLoading = false
	}

	authorProfileCardClick(event: Event) {
		event.preventDefault()
		this.router.navigate(["store", "author", this.authorUuid])
	}

	publisherProfileCardClick(event: Event) {
		event.preventDefault()
		this.router.navigate(["store", "publisher", this.publisherUuid])
	}

	categoryBadgeClick(event: Event, categoryKey: string) {
		event.preventDefault()
		this.router.navigate(["store", "category", categoryKey])
	}
}
