import { Component, ViewChild } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { MutationResult } from "apollo-angular"
import { ReadFile } from "ngx-file-helpers"
import { faPen as faPenLight } from "@fortawesome/pro-light-svg-icons"
import { isSuccessStatusCode } from "dav-js"
import { EditTitleDialogComponent } from "src/app/components/dialogs/edit-title-dialog/edit-title-dialog.component"
import { CategoriesSelectionDialogComponent } from "src/app/components/dialogs/categories-selection-dialog/categories-selection-dialog.component"
import { PublishChangesDialogComponent } from "src/app/components/dialogs/publish-changes-dialog/publish-changes-dialog.component"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { PriceInputComponent } from "src/app/components/price-input/price-input.component"
import { IsbnInputComponent } from "src/app/components/isbn-input/isbn-input.component"
import { Author } from "src/app/models/Author"
import { StoreBookCollection } from "src/app/models/StoreBookCollection"
import { StoreBook } from "src/app/models/StoreBook"
import { StoreBookRelease } from "src/app/models/StoreBookRelease"
import * as ErrorCodes from "src/constants/errorCodes"
import {
	StoreBookStatus,
	StoreBookReleaseStatus,
	StoreBookResource
} from "src/app/misc/types"
import { enUS } from "src/locales/locales"

@Component({
	templateUrl: "./author-book-page.component.html",
	styleUrls: ["./author-book-page.component.scss"]
})
export class AuthorBookPageComponent {
	locale = enUS.authorBookPage
	faPenLight = faPenLight
	@ViewChild("priceInput")
	priceInput: PriceInputComponent
	@ViewChild("printPriceInput")
	printPriceInput: PriceInputComponent
	@ViewChild("isbnInput")
	isbnInput: IsbnInputComponent
	@ViewChild("editTitleDialog")
	editTitleDialog: EditTitleDialogComponent
	@ViewChild("categoriesSelectionDialog")
	categoriesSelectionDialog: CategoriesSelectionDialogComponent
	@ViewChild("publishChangesDialog")
	publishChangesDialog: PublishChangesDialogComponent
	uuid: string
	author: Author
	storeBook: StoreBook
	collection: StoreBookCollection
	releases: StoreBookRelease[]
	release: StoreBookRelease
	book: {
		collection: string
		title: string
		description: string
		language: string
		price: number
		printPrice: number
		isbn: string
		status: StoreBookStatus
		coverBlurhash: string
		fileName: string
		printCoverFileName: string
		printFileName: string
		categories: {
			key: string
			name: string
		}[]
	} = {
		collection: "",
		title: "",
		description: "",
		language: "en",
		price: 0,
		printPrice: 0,
		isbn: "",
		status: StoreBookStatus.Unpublished,
		coverBlurhash: null,
		fileName: null,
		printCoverFileName: null,
		printFileName: null,
		categories: []
	}
	editTitleDialogLoading: boolean = false
	editTitleDialogTitle: string = ""
	editTitleDialogTitleError: string = ""
	publishChangesDialogLoading: boolean = false
	publishChangesDialogReleaseNameError: string = ""
	publishChangesDialogReleaseNotesError: string = ""
	changes: boolean = false
	editDescription: boolean = false
	newDescription: string = ""
	newDescriptionError: string = ""
	descriptionLoading: boolean = false
	updateLanguage: boolean = false
	coverContent: string
	coverLoading: boolean = false
	bookFileUploaded: boolean = false
	bookFileLoading: boolean = false
	printCoverUploaded: boolean = false
	printCoverLoading: boolean = false
	printFileUploaded: boolean = false
	printFileLoading: boolean = false
	statusLoading: boolean = false
	priceUpdating: boolean = false
	printPriceUpdating: boolean = false
	isbnUpdating: boolean = false
	categoriesSelectionDialogLoading: boolean = false
	orderTestPrintLoading: boolean = false
	backButtonLink: string = ""
	errorMessage: string = ""
	categoryKeys: string[] = []

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().authorBookPage
	}

	async ngOnInit() {
		// Wait for the user to be loaded
		await this.dataService.userPromiseHolder.AwaitResult()
		await this.dataService.userAuthorPromiseHolder.AwaitResult()
		await this.dataService.adminAuthorsPromiseHolder.AwaitResult()

		if (this.dataService.userIsAdmin) {
			// Get the author
			let authorUuid =
				this.activatedRoute.snapshot.paramMap.get("author_uuid")
			this.author = this.dataService.adminAuthors.find(
				a => a.uuid == authorUuid
			)

			if (this.author == null) {
				this.author = await Author.Retrieve(
					authorUuid,
					this.dataService,
					this.apiService
				)
			}
		} else if (this.dataService.userAuthor) {
			this.author = this.dataService.userAuthor
		}

		if (this.author == null) {
			this.router.navigate(["author"])
			return
		}

		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get("book_uuid")

		// Get the store book
		this.storeBook = await StoreBook.Retrieve(
			this.uuid,
			this.dataService,
			this.apiService
		)

		if (this.storeBook == null) {
			this.router.navigate(["author"])
			return
		}

		this.collection = await this.storeBook.GetCollection()

		let releasesResult = await this.storeBook.GetReleases()
		this.releases = releasesResult.items
		let releaseUuid =
			this.activatedRoute.snapshot.paramMap.get("release_uuid")

		if (releaseUuid != null) {
			// Get the release
			this.release = this.releases.find(r => r.uuid == releaseUuid)
		}

		// Get the categories
		await this.dataService.categoriesPromiseHolder.AwaitResult()

		if (this.release != null) {
			this.book.title = this.release.title
			this.book.description = this.release.description ?? ""
			this.book.language = this.storeBook.language
			this.book.price = this.release.price
			this.book.printPrice = this.release.printPrice
			this.book.isbn = this.release.isbn ?? ""
			this.book.status = this.storeBook.status
			this.book.coverBlurhash = this.release.cover?.blurhash
			this.book.fileName = this.release.file?.fileName
			this.book.printCoverFileName = this.release.printCover?.fileName
			this.book.printFileName = this.release.printFile?.fileName
			this.bookFileUploaded = this.release.file != null
			this.printCoverUploaded = this.release.printCover != null
			this.printFileUploaded = this.release.printFile != null

			let categories = (await this.release.GetCategories()).items
			this.LoadCategories(categories.map(c => c.key))

			await this.release.GetCoverContent().then(result => {
				if (result != null) this.coverContent = result
			})
		} else {
			this.book.title = this.storeBook.title
			this.book.description = this.storeBook.description ?? ""
			this.book.language = this.storeBook.language
			this.book.price = this.storeBook.price
			this.book.printPrice = this.storeBook.printPrice
			this.book.isbn = this.storeBook.isbn ?? ""
			this.book.status = this.storeBook.status
			this.book.coverBlurhash = this.storeBook.cover?.blurhash
			this.book.fileName = this.storeBook.file.fileName
			this.book.printCoverFileName = this.storeBook.printCover.fileName
			this.book.printFileName = this.storeBook.printFile.fileName
			this.bookFileUploaded = this.storeBook.file.fileName != null
			this.printCoverUploaded = this.storeBook.printCover.fileName != null
			this.printFileUploaded = this.storeBook.printFile.fileName != null

			let categories = (await this.storeBook.GetCategories()).items
			this.LoadCategories(categories.map(c => c.key))

			await this.storeBook.GetCoverContent().then(result => {
				if (result != null) this.coverContent = result
			})

			// Check if there are any changes
			let lastRelease = this.releases[0]

			this.changes =
				(this.book.status == StoreBookStatus.Published ||
					this.book.status == StoreBookStatus.Hidden) &&
				lastRelease.status == StoreBookReleaseStatus.Unpublished
		}

		this.priceInput.SetPrice(this.book.price)
		this.printPriceInput.SetPrice(this.book.printPrice)
		this.isbnInput.SetIsbn(this.book.isbn)
	}

	async BackButtonClick() {
		if (this.book.status == StoreBookStatus.Unpublished) {
			let storeBooksResult = await this.collection.GetStoreBooks()
			let singleBookInCollection = storeBooksResult.total == 1

			if (singleBookInCollection) {
				if (this.dataService.userIsAdmin) {
					this.router.navigate(["author", this.author.uuid])
				} else {
					this.router.navigate(["author"])
				}
			} else {
				if (this.dataService.userIsAdmin) {
					this.router.navigate([
						"author",
						this.author.uuid,
						"collection",
						this.book.collection
					])
				} else {
					this.router.navigate([
						"author",
						"collection",
						this.book.collection
					])
				}
			}
		} else if (this.dataService.userIsAdmin) {
			if (this.release != null) {
				this.router.navigate([
					"author",
					this.author.uuid,
					"book",
					this.uuid,
					"releases"
				])
			} else {
				this.router.navigate([
					"author",
					this.author.uuid,
					"book",
					this.uuid
				])
			}
		} else if (this.release != null) {
			this.router.navigate(["author", "book", this.uuid, "releases"])
		} else {
			this.router.navigate(["author", "book", this.uuid])
		}
	}

	LoadCategories(keys: string[]) {
		this.book.categories = []

		for (let key of keys) {
			// Find the category with the key
			let category = this.dataService.categories.find(c => c.key == key)

			if (category) {
				this.book.categories.push({
					key: category.key,
					name: category.name
				})
			}
		}
	}

	ShowEditTitleDialog() {
		this.editTitleDialogTitle = this.book.title
		this.editTitleDialogTitleError = ""
		this.editTitleDialogLoading = false
		this.editTitleDialog.show()
	}

	async UpdateTitle(result: { title: string }) {
		this.editTitleDialogLoading = true

		let response = await this.apiService.updateStoreBook(`title`, {
			uuid: this.uuid,
			title: result.title
		})

		this.editTitleDialogLoading = false
		this.UpdateStoreBookResponse(response)
	}

	async EditDescription() {
		if (this.editDescription) {
			this.newDescriptionError = ""
			this.descriptionLoading = true

			//	Save the new description on the server
			this.UpdateStoreBookResponse(
				await this.apiService.updateStoreBook(`description`, {
					uuid: this.uuid,
					description: this.newDescription
				})
			)
		} else {
			this.newDescription = this.book.description
				? this.book.description
				: ""
			this.newDescriptionError = ""
			this.editDescription = true
		}
	}

	async SetLanguage(language: string) {
		this.updateLanguage = true

		this.UpdateStoreBookResponse(
			await this.apiService.updateStoreBook(`language`, {
				uuid: this.uuid,
				language
			})
		)
	}

	ShowCategoriesDialog() {
		this.categoryKeys = []

		for (let category of this.book.categories) {
			this.categoryKeys.push(category.key)
		}

		this.categoriesSelectionDialogLoading = false
		this.categoriesSelectionDialog.show()
	}

	async UpdateCategories(result: { categoryKeys: string[] }) {
		this.categoriesSelectionDialogLoading = true

		// Update the categories on the server
		await this.apiService.updateStoreBook(`uuid`, {
			uuid: this.uuid,
			categories: result.categoryKeys
		})

		this.LoadCategories(result.categoryKeys)
		this.categoriesSelectionDialog.hide()
		this.categoriesSelectionDialogLoading = false
		this.ShowChanges()
	}

	async UpdatePrice(price: number) {
		this.priceUpdating = true

		this.UpdateStoreBookResponse(
			await this.apiService.updateStoreBook(`price`, {
				uuid: this.uuid,
				price
			})
		)
	}

	async UpdatePrintPrice(printPrice: number) {
		this.printPriceUpdating = true

		this.UpdateStoreBookResponse(
			await this.apiService.updateStoreBook(`printPrice`, {
				uuid: this.uuid,
				printPrice
			})
		)
	}

	async UpdateIsbn(isbn: string) {
		this.isbnUpdating = true

		this.UpdateStoreBookResponse(
			await this.apiService.updateStoreBook(`isbn`, {
				uuid: this.uuid,
				isbn
			})
		)
	}

	async CoverUpload(file: ReadFile) {
		let oldCoverContent = this.coverContent

		// Get the content of the image file
		let readPromise: Promise<ArrayBuffer> = new Promise(resolve => {
			let reader = new FileReader()
			reader.addEventListener("loadend", () => {
				resolve(reader.result as ArrayBuffer)
			})
			reader.readAsArrayBuffer(new Blob([file.underlyingFile]))
		})

		let imageContent = await readPromise

		let image = new Image()
		let imageHeight = 0
		let imageWidth = 0

		let imageLoadPromise = new Promise((resolve: Function) => {
			image.onload = () => {
				imageHeight = image.height
				imageWidth = image.width
				resolve()
			}
		})

		image.src = file.content
		await imageLoadPromise

		// TODO: Validate the image dimensions
		this.coverContent = file.content
		this.coverLoading = true

		// Upload the image
		let coverUploadResponse = await this.apiService.uploadStoreBookCover({
			uuid: this.uuid,
			contentType: file.type,
			data: imageContent
		})

		this.coverLoading = false

		if (isSuccessStatusCode(coverUploadResponse.status)) {
			this.ShowChanges()
		} else {
			// Remove the cover
			this.coverContent = oldCoverContent

			// Show error
			this.errorMessage = this.locale.errors.unexpectedErrorLong
		}
	}

	async BookFileUpload(file: ReadFile) {
		let readPromise: Promise<ArrayBuffer> = new Promise(resolve => {
			let reader = new FileReader()
			reader.addEventListener("loadend", () => {
				resolve(reader.result as ArrayBuffer)
			})
			reader.readAsArrayBuffer(new Blob([file.underlyingFile]))
		})

		let fileContent = await readPromise
		this.bookFileLoading = true

		// Upload the file
		let response = await this.apiService.uploadStoreBookFile({
			uuid: this.uuid,
			contentType: file.type,
			data: fileContent,
			fileName: file.name
		})

		this.bookFileUploaded = isSuccessStatusCode(response.status)
		this.bookFileLoading = false

		if (isSuccessStatusCode(response.status)) {
			this.book.fileName = file.name
			this.ShowChanges()
		} else {
			// Show error
			this.errorMessage = this.locale.errors.unexpectedErrorLong
		}
	}

	async PrintCoverUpload(file: ReadFile) {
		let readPromise: Promise<ArrayBuffer> = new Promise(resolve => {
			let reader = new FileReader()
			reader.addEventListener("loadend", () => {
				resolve(reader.result as ArrayBuffer)
			})
			reader.readAsArrayBuffer(new Blob([file.underlyingFile]))
		})

		let fileContent = await readPromise
		this.printCoverLoading = true

		// Upload the file
		let response = await this.apiService.uploadStoreBookPrintCover({
			uuid: this.uuid,
			data: fileContent,
			fileName: file.name
		})

		this.printCoverUploaded = isSuccessStatusCode(response.status)
		this.printCoverLoading = false

		if (isSuccessStatusCode(response.status)) {
			this.book.printCoverFileName = file.name
			this.ShowChanges()
		} else {
			// Show error
			this.errorMessage = this.locale.errors.unexpectedErrorLong
		}
	}

	async PrintFileUpload(file: ReadFile) {
		let readPromise: Promise<ArrayBuffer> = new Promise(resolve => {
			let reader = new FileReader()
			reader.addEventListener("loadend", () => {
				resolve(reader.result as ArrayBuffer)
			})
			reader.readAsArrayBuffer(new Blob([file.underlyingFile]))
		})

		let fileContent = await readPromise
		this.printFileLoading = true

		// Upload the file
		let response = await this.apiService.uploadStoreBookPrintFile({
			uuid: this.uuid,
			data: fileContent,
			fileName: file.name
		})

		this.printFileUploaded = isSuccessStatusCode(response.status)
		this.printFileLoading = false

		if (isSuccessStatusCode(response.status)) {
			this.book.printFileName = file.name
			this.ShowChanges()
		} else {
			// Show error
			this.errorMessage = this.locale.errors.unexpectedErrorLong
		}
	}

	async orderTestPrint() {
		this.orderTestPrintLoading = true

		const createCheckoutSessionResponse =
			await this.apiService.createCheckoutSessionForStoreBook(`url`, {
				storeBookUuid: this.storeBook.uuid,
				successUrl: window.location.href,
				cancelUrl: window.location.href
			})

		if (
			createCheckoutSessionResponse.data.createCheckoutSessionForStoreBook !=
			null
		) {
			window.location.href =
				createCheckoutSessionResponse.data.createCheckoutSessionForStoreBook.url
		}
	}

	async PublishBook() {
		if (this.book.status != StoreBookStatus.Unpublished) return
		this.statusLoading = true

		let response = await this.apiService.updateStoreBook(`uuid`, {
			uuid: this.uuid,
			status: "review"
		})

		if (response.errors == null) {
			//this.collection.ClearStoreBooks()

			// Navigate to the dashboard
			if (this.dataService.userIsAdmin) {
				this.router.navigate([
					"author",
					this.author.uuid,
					"book",
					this.uuid
				])
			} else {
				this.router.navigate(["author", "book", this.uuid])
			}
		} else {
			// Show error message
			this.errorMessage = this.locale.errors.unexpectedErrorLong
			this.statusLoading = false
		}
	}

	async ShowPublishChangesDialog() {
		this.ClearPublishChangesErrors()
		this.publishChangesDialogLoading = false
		this.publishChangesDialog.show()

		// Reload the releases
		//this.storeBook.ClearReleases()
		this.releases = (await this.storeBook.GetReleases()).items
	}

	ClearPublishChangesErrors() {
		this.publishChangesDialogReleaseNameError = ""
		this.publishChangesDialogReleaseNotesError = ""
	}

	async PublishChanges(result: { releaseName: string; releaseNotes: string }) {
		// Load the releases of the StoreBook
		const releasesResult = await this.storeBook.GetReleases()
		const releases = releasesResult.items
		const lastRelease = releases[0]

		if (lastRelease.status != StoreBookReleaseStatus.Unpublished) {
			this.publishChangesDialog.hide()
			return
		}

		this.publishChangesDialogLoading = true

		let response = await this.apiService.publishStoreBookRelease(`uuid`, {
			uuid: lastRelease.uuid,
			releaseName: result.releaseName,
			releaseNotes: result.releaseNotes
		})

		this.publishChangesDialogLoading = false

		if (response.errors == null) {
			this.publishChangesDialog.hide()
			this.publishChangesDialogLoading = false

			this.changes = false
			//this.author.ClearSeries()
			//this.storeBook.ClearReleases()
			//this.collection.ClearStoreBooks()
		} else {
			let errors = response.errors[0].extensions.errors as string[]

			for (let errorCode of errors) {
				switch (errorCode) {
					case ErrorCodes.releaseNameTooShort:
						this.publishChangesDialogReleaseNameError =
							this.locale.errors.releaseNameTooShort
						break
					case ErrorCodes.releaseNameTooLong:
						this.publishChangesDialogReleaseNameError =
							this.locale.errors.releaseNameTooLong
						break
					case ErrorCodes.releaseNotesTooLong:
						this.publishChangesDialogReleaseNotesError =
							this.locale.errors.releaseNotesTooLong
						break
				}
			}
		}
	}

	UpdateStoreBookResponse(
		response: MutationResult<{ updateStoreBook: StoreBookResource }>
	) {
		if (this.editDescription) {
			// The description was updated
			if (response.errors == null) {
				this.book.description = response.data.updateStoreBook.description
				this.editDescription = false
			} else {
				let errors = response.errors[0].extensions.errors as string[]

				switch (errors[0]) {
					case ErrorCodes.descriptionTooLong:
						this.newDescriptionError =
							this.locale.errors.descriptionTooLong
						break
					default:
						this.newDescriptionError = this.locale.errors.unexpectedError
						break
				}
			}

			this.descriptionLoading = false
		} else if (this.updateLanguage) {
			this.updateLanguage = false

			if (response.errors == null) {
				this.book.language = response.data.updateStoreBook.language
			}
		} else if (this.priceUpdating) {
			this.priceUpdating = false

			// The price was updated
			if (response.errors == null) {
				this.book.price = response.data.updateStoreBook.price
				this.priceInput.SetPrice(this.book.price)
			} else {
				let errors = response.errors[0].extensions.errors as string[]

				switch (errors[0]) {
					case ErrorCodes.priceInvalid:
						this.priceInput.SetError(this.locale.errors.priceInvalid)
						break
					default:
						this.priceInput.SetError(this.locale.errors.unexpectedError)
						break
				}
			}
		} else if (this.printPriceUpdating) {
			this.printPriceUpdating = false

			// The printPrice was updated
			if (response.errors == null) {
				this.book.printPrice = response.data.updateStoreBook.printPrice
				this.printPriceInput.SetPrice(this.book.printPrice)
			} else {
				let errors = response.errors[0].extensions.errors as string[]

				switch (errors[0]) {
					case ErrorCodes.printPriceInvalid:
						this.printPriceInput.SetError(this.locale.errors.priceInvalid)
						break
					default:
						this.printPriceInput.SetError(
							this.locale.errors.unexpectedError
						)
						break
				}
			}
		} else if (this.isbnUpdating) {
			this.isbnUpdating = false

			// The ISBN was updated
			if (response.errors == null) {
				let responseData = response.data.updateStoreBook
				this.book.isbn = responseData.isbn ? responseData.isbn : ""
				this.isbnInput.SetIsbn(this.book.isbn)
			} else {
				let errors = response.errors[0].extensions.errors as string[]

				switch (errors[0]) {
					case ErrorCodes.isbnInvalid:
						this.isbnInput.SetError(this.locale.errors.isbnInvalid)
						break
					default:
						this.isbnInput.SetError(this.locale.errors.unexpectedError)
						break
				}
			}
		} else {
			// The title was updated
			if (response.errors == null) {
				this.book.title = response.data.updateStoreBook.title
				this.editTitleDialog.hide()
			} else {
				let errors = response.errors[0].extensions.errors as string[]

				switch (errors[0]) {
					case ErrorCodes.titleTooShort:
						this.editTitleDialogTitleError =
							this.locale.errors.titleTooShort
						break
					case ErrorCodes.titleTooLong:
						this.editTitleDialogTitleError =
							this.locale.errors.titleTooLong
						break
					default:
						this.editTitleDialogTitleError =
							this.locale.errors.unexpectedError
						break
				}
			}
		}

		if (response.errors == null) {
			this.ShowChanges()
		}
	}

	ShowChanges() {
		this.changes = true
		//this.author.ClearSeries()
		//this.storeBook.ClearReleases()
		//this.collection.ClearStoreBooks()
	}
}
