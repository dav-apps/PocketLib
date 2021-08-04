import { Component, HostListener } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import {
	SpinnerSize,
	IButtonStyles,
	IDialogContentProps,
	MessageBarType
} from 'office-ui-fabric-react'
import { PromiseHolder, ApiResponse } from 'dav-js'
import {
	DataService,
	FindAppropriateLanguage
} from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { CachingService } from 'src/app/services/caching-service'
import { RoutingService } from 'src/app/services/routing-service'
import { Author } from 'src/app/misc/types'
import { GetDualScreenSettings, UpdateDialogForDualScreenLayout } from 'src/app/misc/utils'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-new-book-page',
	templateUrl: './new-book-page.component.html'
})
export class NewBookPageComponent {
	//#region Navigation variables
	section: number = 0
	visibleSection: number = 0
	forwardNavigation: boolean = true
	spinnerSize: SpinnerSize = SpinnerSize.small
	loading: boolean = false
	//#endregion

	//#region General variables
	locale = enUS.newBookPage
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
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
	leavePageDialogVisible: boolean = false
	errorMessageBarType: MessageBarType = MessageBarType.error
	errorMessage: string = ""
	navigationEventPromiseHolder = new PromiseHolder<boolean>()

	dialogPrimaryButtonStyles: IButtonStyles = {
		root: {
			marginLeft: 10
		}
	}
	leavePageDialogContentProps: IDialogContentProps = {
		title: this.locale.leavePageDialog.title
	}
	//#endregion

	//#region Title variables
	title: string = ""
	submittedTitle: string = ""
	titleSubmitted: boolean = false
	//#endregion

	//#region Collection variables
	collections: {
		uuid: string,
		name: string,
		cover: boolean,
		coverContent: string
	}[] = []
	selectedCollection: number = -2
	collectionSelected: boolean = false
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

	//#region Loading Screen variables
	height: number = 400
	loadingScreenVisible: boolean = false
	loadingScreenMessage: string = ""
	//#endregion

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private cachingService: CachingService,
		private routingService: RoutingService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().newBookPage
		this.routingService.toolbarNavigationEvent = async () => await this.HandleToolbarNavigationEvent()

		// Check if this is a dual-screen device with a vertical fold
		let dualScreenSettings = GetDualScreenSettings()
		this.dualScreenLayout = dualScreenSettings.dualScreenLayout
		this.dualScreenFoldMargin = dualScreenSettings.dualScreenFoldMargin
	}

	async ngOnInit() {
		this.setSize()
		await this.dataService.userAuthorPromiseHolder.AwaitResult()

		// Get the author
		if (this.dataService.userIsAdmin) {
			// Get the uuid of the author from the url
			let authorUuid = this.activatedRoute.snapshot.queryParamMap.get("author")

			// Find the author with the uuid
			let author = this.dataService.adminAuthors.find(a => a.uuid == authorUuid)
			if (!author) {
				this.GoBack()
				return
			}

			this.author = author
		} else if (this.dataService.userAuthor) {
			// Get the current author
			this.author = this.dataService.userAuthor
		} else {
			// Go back, as the user it not an author and not an admin
			this.GoBack()
			return
		}

		// Get the collections
		for (let collection of this.author.collections) {
			// Find the correct name
			let i = FindAppropriateLanguage(this.dataService.supportedLocale, collection.names)

			// Find a cover
			let cover: boolean = false
			let coverContent: string = ""
			for (let book of collection.books) {
				if (book.cover) {
					cover = true
					coverContent = book.coverContent
					break
				}
			}

			this.collections.push({
				uuid: collection.uuid,
				name: collection.names[i].name,
				cover,
				coverContent
			})
		}

		// If the user navigated from the collection view, preselect the appropriate collection
		let collectionUuid = this.activatedRoute.snapshot.queryParamMap.get("collection")
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

	@HostListener('window:resize')
	setSize() {
		this.height = window.innerHeight
	}

	@HostListener('window:beforeunload', ['$event'])
	ShowAlert(event: any) {
		event.returnValue = true
	}

	async HandleToolbarNavigationEvent() {
		this.navigationEventPromiseHolder.Setup()

		// Show the leave page dialog
		this.ShowLeavePageDialog()

		return await this.navigationEventPromiseHolder.AwaitResult()
	}

	async GoBack() {
		this.navigationEventPromiseHolder.Setup()

		// Show the leave page dialog
		this.ShowLeavePageDialog()

		if (await this.navigationEventPromiseHolder.AwaitResult()) {
			this.routingService.NavigateBack("/author")
		}
	}

	ShowLeavePageDialog() {
		this.leavePageDialogContentProps.title = this.locale.leavePageDialog.title
		this.leavePageDialogVisible = true

		if (this.dualScreenLayout) {
			UpdateDialogForDualScreenLayout()
		}
	}

	LeavePageDialogLeave() {
		this.leavePageDialogVisible = false
		this.navigationEventPromiseHolder.Resolve(true)
	}

	LeavePageDialogCancel() {
		this.leavePageDialogVisible = false
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

		if (this.title.length >= 3) {
			// Wait for the collections
			this.loading = true
			await this.loadCollectionsPromiseHolder.AwaitResult()
			this.loading = false

			this.Next()

			this.submittedTitle = this.title
			this.titleSubmitted = true
		}
	}
	//#endregion

	//#region Collection functions
	SelectCollection(index: number) {
		this.selectedCollection = index

		if (!this.collectionSelected) {
			this.collectionSelected = true
			this.Next()
		}
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
		coverContentBase64: string,
		coverContent: ArrayBuffer,
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
		bookFileName: string,
		bookFileContent: ArrayBuffer,
		bookFileType: string
	}) {
		this.bookFileName = bookFileDetails.bookFileName
		this.bookFileContent = bookFileDetails.bookFileContent
		this.bookFileType = bookFileDetails.bookFileType
	}
	//#endregion

	//#region Loading Screen functions
	ShowLoadingScreen() {
		this.loadingScreenVisible = true

		setTimeout(() => {
			this.dataService.navbarVisible = false

			// Set the color of the progress ring
			let progress = document.getElementsByTagName('circle')
			if (progress.length > 0) {
				let item = progress.item(0)
				item.setAttribute('style', item.getAttribute('style') + ' stroke: white')
			}
		}, 1)
	}

	HideLoadingScreen() {
		this.dataService.navbarVisible = true
		this.loadingScreenVisible = false
	}

	async Finish() {
		this.ShowLoadingScreen()
		let authorUuid = this.dataService.userIsAdmin ? this.author.uuid : null
		let collectionUuid = null

		this.loadingScreenMessage = this.locale.loadingScreen.creatingBook

		if (!this.noCollections && this.selectedCollection > -1) {
			collectionUuid = this.collections[this.selectedCollection].uuid
		}

		// Create the store book with collection, title and language
		let createStoreBookResponse = await this.apiService.CreateStoreBook({
			author: authorUuid,
			collection: collectionUuid,
			description: this.description,
			title: this.title,
			language: this.language,
			price: this.price,
			isbn: this.isbn,
			categories: this.selectedCategories
		})

		if (createStoreBookResponse.status != 201) {
			this.errorMessage = this.locale.errorMessage
			this.HideLoadingScreen()
			return
		}

		let createStoreBookResponseData = (createStoreBookResponse as ApiResponse<any>).data

		if (this.coverContent) {
			this.loadingScreenMessage = this.locale.loadingScreen.uploadingCover

			// Upload the cover
			await this.apiService.SetStoreBookCover({
				uuid: createStoreBookResponseData.uuid,
				type: this.coverType,
				file: this.coverContent
			})
		}

		if (this.bookFileContent) {
			this.loadingScreenMessage = this.locale.loadingScreen.uploadingBookFile

			// Upload the book file
			await this.apiService.SetStoreBookFile({
				uuid: createStoreBookResponseData.uuid,
				type: this.bookFileType,
				name: this.bookFileName,
				file: this.bookFileContent
			})
		}

		// Remove GetStoreBookCollection responses from ApiService cache
		this.cachingService.ClearApiRequestCache(this.apiService.GetStoreBookCollection.name)

		// Reload the author of the user
		this.loadingScreenMessage = this.locale.loadingScreen.updatingLocalData
		await this.dataService.LoadAuthorOfUser()

		// Redirect to the AuthorBookPage
		this.dataService.navbarVisible = true
		this.router.navigate(["author", "book", createStoreBookResponseData.uuid])
	}
	//#endregion
}