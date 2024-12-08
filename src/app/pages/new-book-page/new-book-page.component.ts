import { Component, HostListener, ViewChild } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { PromiseHolder } from "dav-js"
import { LeavePageDialogComponent } from "src/app/components/dialogs/leave-page-dialog/leave-page-dialog.component"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { LocalizationService } from "src/app/services/localization-service"
import { RoutingService } from "src/app/services/routing-service"
import { SettingsService } from "src/app/services/settings-service"
import { Author } from "src/app/models/Author"

@Component({
	selector: "pocketlib-new-book-page",
	templateUrl: "./new-book-page.component.html",
	styleUrls: ["./new-book-page.component.scss"]
})
export class NewBookPageComponent {
	//#region Navigation variables
	section: number = 0
	visibleSection: number = 0
	forwardNavigation: boolean = true
	loading: boolean = false
	//#endregion

	//#region General variables
	locale = this.localizationService.locale.newBookPage
	author: Author
	errorMessage: string = ""
	navigationEventPromiseHolder = new PromiseHolder<boolean>()
	@ViewChild("leavePageDialog")
	leavePageDialog: LeavePageDialogComponent
	//#endregion

	//#region Title variables
	title: string = ""
	submittedTitle: string = ""
	titleSubmitted: boolean = false
	//#endregion

	//#region Collection variables
	collections: {
		uuid: string
		name: string
		coverContent: string
	}[] = []
	selectedCollection: number = -2
	loadCollectionsPromiseHolder = new PromiseHolder()
	noCollections: boolean = false
	//#endregion

	//#region Description + Language variables
	description: string = ""
	language: string = this.dataService.supportedLocale
	//#endregion

	//#region Categories variables
	selectedCategories: string[] = []
	//#endregion

	//#region Price variables
	price: number = 0
	//#endregion

	//#region ISBN variables
	isbn: string = ""
	//#endregion

	//#region Cover variables
	coverContentBase64: string = ""
	coverContent: ArrayBuffer
	coverType: string = ""
	//#endregion

	//#region BookFile variables
	bookFileName: string = ""
	bookFileContent: ArrayBuffer
	bookFileType: string = ""
	//#endregion

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private routingService: RoutingService,
		private localizationService: LocalizationService,
		private settingsService: SettingsService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.routingService.toolbarNavigationEvent = async () =>
			await this.HandleToolbarNavigationEvent()

		this.dataService.setMeta()
	}

	async ngOnInit() {
		await this.dataService.userAuthorPromiseHolder.AwaitResult()

		// Get the author
		if (this.dataService.userIsAdmin) {
			// Get the uuid of the author from the url
			let authorUuid = this.activatedRoute.snapshot.paramMap.get("uuid")

			// Find the author with the uuid
			let author = this.dataService.adminAuthors.find(
				a => a.uuid == authorUuid
			)

			if (author == null) {
				author = await Author.Retrieve(
					authorUuid,
					await this.settingsService.getStoreLanguages(
						this.dataService.locale
					),
					this.apiService
				)
			}

			this.author = author
		} else if (this.dataService.userAuthor) {
			// Get the current author
			this.author = this.dataService.userAuthor
		}

		if (this.author == null) {
			this.routingService.navigateBack("/author")
			return
		}

		// Get the collections
		let collectionsResult = await this.author.GetCollections()

		for (let collection of collectionsResult.items) {
			let collectionItem = {
				uuid: collection.uuid,
				name: collection.name.name,
				coverContent: this.dataService.defaultStoreBookCover
			}

			let storeBooksResult = await collection.GetStoreBooks()

			for (let book of storeBooksResult.items) {
				if (book.cover.url != null) {
					book.GetCoverContent().then(result => {
						if (result != null) collectionItem.coverContent = result
					})

					break
				}
			}

			this.collections.push(collectionItem)
		}

		// If the user navigated from the collection view, preselect the appropriate collection
		let collectionUuid =
			this.activatedRoute.snapshot.queryParamMap.get("collection")

		if (collectionUuid) {
			let i = this.collections.findIndex(c => c.uuid == collectionUuid)
			if (i != -1) this.selectedCollection = i
		}

		this.loadCollectionsPromiseHolder.Resolve()
		this.noCollections = this.collections.length == 0
	}

	ngOnDestroy() {
		this.routingService.toolbarNavigationEvent = null
	}

	@HostListener("window:beforeunload", ["$event"])
	ShowAlert(event: any) {
		event.returnValue = true
	}

	async HandleToolbarNavigationEvent() {
		this.navigationEventPromiseHolder.Setup()

		// Show the leave page dialog
		this.leavePageDialog.show()

		return await this.navigationEventPromiseHolder.AwaitResult()
	}

	async GoBack() {
		this.navigationEventPromiseHolder.Setup()

		// Show the leave page dialog
		this.leavePageDialog.show()

		if (await this.navigationEventPromiseHolder.AwaitResult()) {
			this.routingService.navigateBack("/author")
		}
	}

	LeavePageDialogLeave() {
		this.leavePageDialog.hide()
		this.navigationEventPromiseHolder.Resolve(true)
	}

	LeavePageDialogCancel() {
		this.leavePageDialog.hide()
		this.navigationEventPromiseHolder.Resolve(false)
	}

	Previous() {
		if (this.noCollections && this.section == 2) {
			// Skip the collections section
			this.NavigateToSection(this.section - 2)
		} else {
			this.NavigateToSection(this.section - 1)
		}
	}

	Next() {
		if (this.noCollections && this.section == 0) {
			// Skip the collections section
			this.NavigateToSection(this.section + 2)
		} else {
			this.NavigateToSection(this.section + 1)
		}
	}

	NavigateToSection(index: number) {
		this.forwardNavigation = index > this.section
		this.section = index
		this.errorMessage = ""

		setTimeout(() => {
			this.visibleSection = index
		}, 500)
	}

	//#region Name functions
	async SubmitTitle(title: string) {
		this.title = title

		// Wait for the collections
		this.loading = true
		await this.loadCollectionsPromiseHolder.AwaitResult()
		this.loading = false

		this.Next()

		this.submittedTitle = this.title
		this.titleSubmitted = true
	}
	//#endregion

	//#region Collection functions
	SelectCollection(index: number) {
		this.selectedCollection = index
		this.Next()
	}

	SubmitCollection(selectedCollection: number) {
		this.selectedCollection = selectedCollection

		if (this.selectedCollection != -2) {
			this.Next()
		}
	}
	//#endregion

	//#region Description + Language functions
	SetLanguage(language: string) {
		this.language = language
	}

	SubmitDescription(description: string) {
		this.description = description
		this.Next()
	}
	//#endregion

	//#region Categories functions
	SubmitCategories(selectedCategories: string[]) {
		this.selectedCategories = selectedCategories
		this.Next()
	}
	//#endregion

	//#region Price functions
	SetPrice(price: number) {
		this.price = price
	}

	SubmitPrice() {
		this.Next()
	}
	//#endregion

	//#region ISBN functions
	SetIsbn(isbn: string) {
		this.isbn = isbn
	}

	SubmitIsbn() {
		this.Next()
	}
	//#endregion

	//#region Cover functions
	SetCover(coverDetails: {
		coverContentBase64: string
		coverContent: ArrayBuffer
		coverType: string
	}) {
		this.coverContentBase64 = coverDetails.coverContentBase64
		this.coverContent = coverDetails.coverContent
		this.coverType = coverDetails.coverType
	}

	SubmitCover() {
		this.Next()
	}
	//#endregion

	//#region Book file functions
	SetBookFile(bookFileDetails: {
		bookFileName: string
		bookFileContent: ArrayBuffer
		bookFileType: string
	}) {
		this.bookFileName = bookFileDetails.bookFileName
		this.bookFileContent = bookFileDetails.bookFileContent
		this.bookFileType = bookFileDetails.bookFileType
	}
	//#endregion

	//#region Loading Screen functions
	ShowLoadingScreen() {
		this.dataService.loadingScreenVisible = true

		setTimeout(() => {
			this.dataService.navbarVisible = false

			// Set the color of the progress ring
			let progress = document.getElementsByTagName("circle")
			if (progress.length > 0) {
				let item = progress.item(0)
				item.setAttribute(
					"style",
					item.getAttribute("style") + " stroke: white"
				)
			}
		}, 1)
	}

	HideLoadingScreen() {
		this.dataService.navbarVisible = true
		this.dataService.loadingScreenVisible = false
	}

	async Finish() {
		this.ShowLoadingScreen()
		let authorUuid = this.dataService.userIsAdmin ? this.author.uuid : null
		let collectionUuid = null

		this.dataService.loadingScreenMessage =
			this.locale.loadingScreen.creatingBook

		if (!this.noCollections && this.selectedCollection > -1) {
			collectionUuid = this.collections[this.selectedCollection].uuid
		}

		// Create the store book with collection, title and language
		let createStoreBookResponse = await this.apiService.createStoreBook(
			`uuid`,
			{
				author: authorUuid,
				collection: collectionUuid,
				description: this.description.length > 0 ? this.description : null,
				title: this.title,
				language: this.language,
				price: this.price,
				isbn: this.isbn,
				categories: this.selectedCategories
			}
		)

		if (createStoreBookResponse.errors != null) {
			this.errorMessage = this.locale.errorMessage
			this.HideLoadingScreen()
			return
		}

		let createStoreBookResponseData =
			createStoreBookResponse.data.createStoreBook

		if (this.coverContent) {
			this.dataService.loadingScreenMessage =
				this.locale.loadingScreen.uploadingCover

			// Upload the cover
			await this.apiService.uploadStoreBookCover({
				uuid: createStoreBookResponseData.uuid,
				contentType: this.coverType,
				data: this.coverContent
			})
		}

		if (this.bookFileContent) {
			this.dataService.loadingScreenMessage =
				this.locale.loadingScreen.uploadingBookFile

			// Upload the book file
			await this.apiService.uploadStoreBookFile({
				uuid: createStoreBookResponseData.uuid,
				contentType: this.bookFileType,
				data: this.bookFileContent,
				fileName: this.bookFileName
			})
		}

		// Remove RetrieveStoreBookCollection responses from ApiService cache
		//this.author.ClearCollections()

		// Reload the author of the user
		this.dataService.loadingScreenMessage =
			this.locale.loadingScreen.updatingLocalData
		await this.dataService.LoadAuthorOfUser()

		// Redirect to the AuthorBookPage
		this.dataService.navbarVisible = true

		if (this.dataService.userIsAdmin) {
			this.router.navigate([
				"author",
				this.author.uuid,
				"book",
				createStoreBookResponseData.uuid,
				"details"
			])
		} else {
			this.router.navigate([
				"author",
				"book",
				createStoreBookResponseData.uuid,
				"details"
			])
		}
	}
	//#endregion
}
