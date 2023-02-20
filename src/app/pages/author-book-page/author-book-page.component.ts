import { Component, ViewChild } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { ReadFile } from 'ngx-file-helpers'
import { faPen as faPenLight } from '@fortawesome/pro-light-svg-icons'
import { ApiErrorResponse, ApiResponse, isSuccessStatusCode } from 'dav-js'
import { DataService } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { CachingService } from 'src/app/services/caching-service'
import { CategoriesSelectionComponent } from 'src/app/components/categories-selection/categories-selection.component'
import { PriceInputComponent } from 'src/app/components/price-input/price-input.component'
import { IsbnInputComponent } from 'src/app/components/isbn-input/isbn-input.component'
import { Author } from 'src/app/models/Author'
import { StoreBookCollection } from 'src/app/models/StoreBookCollection'
import { StoreBook } from 'src/app/models/StoreBook'
import { StoreBookRelease } from 'src/app/models/StoreBookRelease'
import * as ErrorCodes from 'src/constants/errorCodes'
import {
	StoreBookStatus,
	StoreBookReleaseStatus,
	StoreBookField,
	StoreBookResource
} from 'src/app/misc/types'
import { GetDualScreenSettings } from 'src/app/misc/utils'
import { enUS } from 'src/locales/locales'

@Component({
	templateUrl: './author-book-page.component.html',
	styleUrls: ['./author-book-page.component.scss']
})
export class AuthorBookPageComponent {
	locale = enUS.authorBookPage
	faPenLight = faPenLight
	@ViewChild('categoriesSelection') categoriesSelectionComponent: CategoriesSelectionComponent
	@ViewChild('priceInput') priceInput: PriceInputComponent
	@ViewChild('isbnInput') isbnInput: IsbnInputComponent
	showMobileLayout: boolean = false
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	uuid: string
	author: Author
	storeBook: StoreBook
	collection: StoreBookCollection
	releases: StoreBookRelease[]
	release: StoreBookRelease
	book: {
		collection: string,
		title: string,
		description: string,
		language: string,
		price: number,
		isbn: string,
		status: StoreBookStatus,
		coverBlurhash: string,
		fileName: string,
		categories: {
			key: string,
			name: string
		}[]
	} = {
			collection: "",
			title: "",
			description: "",
			language: "en",
			price: 0,
			isbn: "",
			status: StoreBookStatus.Unpublished,
			coverBlurhash: null,
			fileName: null,
			categories: []
		}
	editTitleDialogVisible: boolean = false
	editTitleDialogLoading: boolean = false
	editTitleDialogTitle: string = ""
	editTitleDialogTitleError: string = ""
	publishChangesDialogVisible: boolean = false
	publishChangesDialogLoading: boolean = false
	publishChangesDialogReleaseName: string = ""
	publishChangesDialogReleaseNotes: string = ""
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
	statusLoading: boolean = false
	priceUpdating: boolean = false
	isbnUpdating: boolean = false
	categoriesSelectionDialogVisible: boolean = false
	categoriesSelectionDialogLoading: boolean = false
	backButtonLink: string = ""
	errorMessage: string = ""

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private cachingService: CachingService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().authorBookPage

		// Check if this is a dual-screen device with a vertical fold
		let dualScreenSettings = GetDualScreenSettings()
		this.dualScreenLayout = dualScreenSettings.dualScreenLayout
		this.dualScreenFoldMargin = dualScreenSettings.dualScreenFoldMargin
	}

	async ngOnInit() {
		// Wait for the user to be loaded
		await this.dataService.userPromiseHolder.AwaitResult()
		await this.dataService.userAuthorPromiseHolder.AwaitResult()
		await this.dataService.adminAuthorsPromiseHolder.AwaitResult()

		if (this.dataService.userIsAdmin) {
			// Get the author
			let authorUuid = this.activatedRoute.snapshot.paramMap.get("author_uuid")
			this.author = this.dataService.adminAuthors.find(a => a.uuid == authorUuid)

			if (this.author == null) {
				for (let publisher of this.dataService.adminPublishers) {
					this.author = (await publisher.GetAuthors()).find(a => a.uuid == authorUuid)
					if (this.author != null) break
				}
			}
		} else if (this.dataService.userAuthor) {
			this.author = this.dataService.userAuthor
		}

		if (this.author == null) {
			this.router.navigate(['author'])
			return
		}

		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get("book_uuid")

		// Get the store book
		let book: StoreBook = null

		for (let collection of await this.author.GetCollections()) {
			book = (await collection.GetStoreBooks()).find(b => b.uuid == this.uuid)

			if (book != null) {
				this.storeBook = book
				this.collection = collection
				break
			}
		}

		if (book == null) {
			this.router.navigate(['author'])
			return
		}

		this.releases = await book.GetReleases()
		let releaseUuid = this.activatedRoute.snapshot.paramMap.get("release_uuid")

		if (releaseUuid != null) {
			// Get the release
			this.release = this.releases.find(r => r.uuid == releaseUuid)
		}

		// Get the categories
		await this.dataService.categoriesPromiseHolder.AwaitResult()

		if (this.release != null) {
			this.book.collection = book.collection
			this.book.title = this.release.title
			this.book.description = this.release.description ?? ""
			this.book.language = book.language
			this.book.price = this.release.price
			this.book.isbn = this.release.isbn ?? ""
			this.book.status = book.status
			this.book.coverBlurhash = this.release.cover?.blurhash
			this.book.fileName = this.release.file?.fileName
			this.bookFileUploaded = this.release.file != null
			this.LoadCategories(this.release.categories)

			await this.release.GetCoverContent().then(result => {
				if (result != null) this.coverContent = result
			})
		} else {
			this.book.collection = book.collection
			this.book.title = book.title
			this.book.description = book.description ?? ""
			this.book.language = book.language
			this.book.price = book.price
			this.book.isbn = book.isbn ?? ""
			this.book.status = book.status
			this.book.coverBlurhash = book.cover?.blurhash
			this.book.fileName = book.file.fileName
			this.bookFileUploaded = book.file.fileName != null
			this.LoadCategories(book.categories)

			await book.GetCoverContent().then(result => {
				if (result != null) this.coverContent = result
			})

			// Check if there are any changes
			let lastRelease = this.releases[0]

			this.changes = (
				(this.book.status == StoreBookStatus.Published || this.book.status == StoreBookStatus.Hidden)
				&& lastRelease.status == StoreBookReleaseStatus.Unpublished
			)
		}

		this.priceInput.SetPrice(this.book.price)
		this.isbnInput.SetIsbn(this.book.isbn)
	}

	async BackButtonClick() {
		if (this.book.status == StoreBookStatus.Unpublished) {
			let singleBookInCollection = (await this.collection.GetStoreBooks()).length == 1

			if (singleBookInCollection) {
				if (this.dataService.userIsAdmin) {
					this.router.navigate(["author", this.author.uuid])
				} else {
					this.router.navigate(["author"])
				}
			} else {
				if (this.dataService.userIsAdmin) {
					this.router.navigate(["author", this.author.uuid, "collection", this.book.collection])
				} else {
					this.router.navigate(["author", "collection", this.book.collection])
				}
			}
		} else if (this.dataService.userIsAdmin) {
			if (this.release != null) {
				this.router.navigate(["author", this.author.uuid, "book", this.uuid, "releases"])
			} else {
				this.router.navigate(["author", this.author.uuid, "book", this.uuid])
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
		this.editTitleDialogVisible = true
	}

	async UpdateTitle() {
		this.editTitleDialogLoading = true

		let response = await this.apiService.UpdateStoreBook({
			uuid: this.uuid,
			title: this.editTitleDialogTitle,
			fields: [StoreBookField.title]
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
				await this.apiService.UpdateStoreBook({
					uuid: this.uuid,
					description: this.newDescription,
					fields: [StoreBookField.description]
				})
			)
		} else {
			this.newDescription = this.book.description ? this.book.description : ""
			this.newDescriptionError = ""
			this.editDescription = true
		}
	}

	async SetLanguage(language: string) {
		this.updateLanguage = true

		this.UpdateStoreBookResponse(
			await this.apiService.UpdateStoreBook({
				uuid: this.uuid,
				language,
				fields: [StoreBookField.language]
			})
		)
	}

	ShowCategoriesDialog() {
		this.categoriesSelectionDialogLoading = false
		this.categoriesSelectionDialogVisible = true

		setTimeout(() => {
			// Get the category keys of the book
			let keys: string[] = []
			this.book.categories.forEach(c => keys.push(c.key))
			this.categoriesSelectionComponent.SetSelectedCategories(keys)
		}, 10)
	}

	async UpdateCategories() {
		let categories = this.categoriesSelectionComponent.GetSelectedCategories()
		this.categoriesSelectionDialogLoading = true

		// Update the categories on the server
		await this.apiService.UpdateStoreBook({
			uuid: this.uuid,
			categories
		})

		this.LoadCategories(categories)
		this.categoriesSelectionDialogVisible = false
		this.categoriesSelectionDialogLoading = false
		this.ShowChanges()
	}

	async UpdatePrice(price: number) {
		this.priceUpdating = true

		this.UpdateStoreBookResponse(
			await this.apiService.UpdateStoreBook({
				uuid: this.uuid,
				price,
				fields: [StoreBookField.price]
			})
		)
	}

	async UpdateIsbn(isbn: string) {
		this.isbnUpdating = true

		this.UpdateStoreBookResponse(
			await this.apiService.UpdateStoreBook({
				uuid: this.uuid,
				isbn,
				fields: [StoreBookField.isbn]
			})
		)
	}

	async CoverUpload(file: ReadFile) {
		let oldCoverContent = this.coverContent

		// Get the content of the image file
		let readPromise: Promise<ArrayBuffer> = new Promise(resolve => {
			let reader = new FileReader()
			reader.addEventListener('loadend', () => {
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
		let coverUploadResponse = await this.apiService.UploadStoreBookCover({
			uuid: this.uuid,
			type: file.type,
			file: imageContent
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
		let readPromise: Promise<ArrayBuffer> = new Promise((resolve) => {
			let reader = new FileReader()
			reader.addEventListener('loadend', () => {
				resolve(reader.result as ArrayBuffer)
			})
			reader.readAsArrayBuffer(new Blob([file.underlyingFile]))
		})

		let fileContent = await readPromise
		this.bookFileLoading = true

		// Upload the file
		let response = await this.apiService.UploadStoreBookFile({
			uuid: this.uuid,
			type: file.type,
			name: file.name,
			file: fileContent
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

	async PublishBook() {
		if (this.book.status != StoreBookStatus.Unpublished) return
		this.statusLoading = true

		let response = await this.apiService.UpdateStoreBook({
			uuid: this.uuid,
			status: "review"
		})

		if (isSuccessStatusCode(response.status)) {
			this.collection.ClearStoreBooks()

			// Navigate to the dashboard
			if (this.dataService.userIsAdmin) {
				this.router.navigate(["author", this.author.uuid, "book", this.uuid])
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
		this.publishChangesDialogVisible = true

		// Reload the releases
		this.storeBook.ClearReleases()
		this.releases = await this.storeBook.GetReleases()
	}

	ClearPublishChangesErrors() {
		this.publishChangesDialogReleaseNameError = ""
		this.publishChangesDialogReleaseNotesError = ""
	}

	async PublishChanges() {
		let lastRelease = this.releases[0]
		if (lastRelease.status != StoreBookReleaseStatus.Unpublished) return
		this.publishChangesDialogLoading = true

		let response = await this.apiService.PublishStoreBookRelease({
			uuid: lastRelease.uuid,
			releaseName: this.publishChangesDialogReleaseName,
			releaseNotes: this.publishChangesDialogReleaseNotes
		})

		this.publishChangesDialogLoading = false

		if (isSuccessStatusCode(response.status)) {
			this.publishChangesDialogVisible = false
			this.publishChangesDialogLoading = false
			this.publishChangesDialogReleaseName = ""
			this.publishChangesDialogReleaseNotes = ""

			this.changes = false
			this.author.ClearSeries()
			this.storeBook.ClearReleases()
			this.collection.ClearStoreBooks()

			this.cachingService.ClearApiRequestCache(
				this.apiService.RetrieveStoreBook.name,
				this.apiService.RetrieveStoreBookCover.name
			)
		} else {
			// Show error message
			let errorCode = (response as ApiErrorResponse).errors[0].code

			switch (errorCode) {
				case ErrorCodes.ReleaseNameTooShort:
					this.publishChangesDialogReleaseNameError = this.locale.errors.releaseNameTooShort
					break
				case ErrorCodes.ReleaseNameTooLong:
					this.publishChangesDialogReleaseNameError = this.locale.errors.releaseNameTooLong
					break
				case ErrorCodes.ReleaseNotesTooShort:
					this.publishChangesDialogReleaseNotesError = this.locale.errors.releaseNotesTooShort
					break
				case ErrorCodes.ReleaseNotesTooLong:
					this.publishChangesDialogReleaseNotesError = this.locale.errors.releaseNotesTooLong
					break
			}
		}
	}

	UpdateStoreBookResponse(response: ApiResponse<any> | ApiErrorResponse) {
		if (this.editDescription) {
			// The description was updated
			if (isSuccessStatusCode(response.status)) {
				this.book.description = (response as ApiResponse<any>).data.description
				this.editDescription = false
			} else {
				let errorCode = (response as ApiErrorResponse).errors[0].code

				switch (errorCode) {
					case ErrorCodes.DescriptionTooShort:
						this.newDescriptionError = this.locale.errors.descriptionTooShort
						break
					case ErrorCodes.DescriptionTooLong:
						this.newDescriptionError = this.locale.errors.descriptionTooLong
						break
					default:
						this.newDescriptionError = this.locale.errors.unexpectedError
						break
				}
			}

			this.descriptionLoading = false
		} else if (this.updateLanguage) {
			this.updateLanguage = false

			if (isSuccessStatusCode(response.status)) {
				this.book.language = (response as ApiResponse<any>).data.language
			}
		} else if (this.priceUpdating) {
			this.priceUpdating = false

			// The price was updated
			if (isSuccessStatusCode(response.status)) {
				this.book.price = (response as ApiResponse<any>).data.price
				this.priceInput.SetPrice(this.book.price)
			} else {
				let errorCode = (response as ApiErrorResponse).errors[0].code

				switch (errorCode) {
					case ErrorCodes.PriceInvalid:
						this.priceInput.SetError(this.locale.errors.priceInvalid)
						break
					default:
						this.priceInput.SetError(this.locale.errors.unexpectedError)
						break
				}
			}
		} else if (this.isbnUpdating) {
			this.isbnUpdating = false

			// The ISBN was updated
			if (isSuccessStatusCode(response.status)) {
				let responseData = (response as ApiResponse<any>).data
				this.book.isbn = responseData.isbn ? responseData.isbn : ""
				this.isbnInput.SetIsbn(this.book.isbn)
			} else {
				let errorCode = (response as ApiErrorResponse).errors[0].code

				switch (errorCode) {
					case ErrorCodes.IsbnInvalid:
						this.isbnInput.SetError(this.locale.errors.isbnInvalid)
						break
					default:
						this.isbnInput.SetError(this.locale.errors.unexpectedError)
						break
				}
			}
		} else {
			// The title was updated
			if (isSuccessStatusCode(response.status)) {
				this.book.title = (response as ApiResponse<StoreBookResource>).data.title
				this.editTitleDialogVisible = false
			} else {
				let errorCode = (response as ApiErrorResponse).errors[0].code

				switch (errorCode) {
					case ErrorCodes.TitleTooShort:
						this.editTitleDialogTitleError = this.locale.errors.titleTooShort
						break
					case ErrorCodes.TitleTooLong:
						this.editTitleDialogTitleError = this.locale.errors.titleTooLong
						break
					default:
						this.editTitleDialogTitleError = this.locale.errors.unexpectedError
						break
				}
			}
		}

		if (isSuccessStatusCode(response.status)) {
			this.ShowChanges()
		}
	}

	ShowChanges() {
		this.changes = true
		this.author.ClearSeries()
		this.storeBook.ClearReleases()
		this.collection.ClearStoreBooks()

		this.cachingService.ClearApiRequestCache(
			this.apiService.RetrieveStoreBook.name,
			this.apiService.RetrieveStoreBookCover.name
		)
	}
}