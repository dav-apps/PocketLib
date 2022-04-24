import { Component, ViewChild } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { ReadFile } from 'ngx-file-helpers'
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
import * as ErrorCodes from 'src/constants/errorCodes'
import { BookStatus, StoreBookField, StoreBookResource } from 'src/app/misc/types'
import { GetDualScreenSettings, GetBookStatusByString } from 'src/app/misc/utils'
import { enUS } from 'src/locales/locales'

@Component({
	templateUrl: './author-book-page.component.html',
	styleUrls: ['./author-book-page.component.scss']
})
export class AuthorBookPageComponent {
	locale = enUS.authorBookPage
	@ViewChild('categoriesSelection') categoriesSelectionComponent: CategoriesSelectionComponent
	@ViewChild('priceInput') priceInput: PriceInputComponent
	@ViewChild('isbnInput') isbnInput: IsbnInputComponent
	showMobileLayout: boolean = false
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	uuid: string
	author: Author
	collection: StoreBookCollection
	book: {
		collection: string,
		title: string,
		description: string,
		language: string,
		price: number,
		isbn: string,
		status: BookStatus,
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
			status: BookStatus.Unpublished,
			coverBlurhash: null,
			fileName: null,
			categories: []
		}
	editTitleDialogVisible: boolean = false
	editTitleDialogLoading: boolean = false
	editTitleDialogTitle: string = ""
	editTitleDialogTitleError: string = ""
	editDescription: boolean = false
	newDescription: string = ""
	newDescriptionError: string = ""
	descriptionLoading: boolean = false
	updateLanguage: boolean = false
	coverContent: string
	coverLoading: boolean = false
	bookFileUploaded: boolean = false
	bookFileLoading: boolean = false
	publishingOrUnpublishing: boolean = false
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
				this.collection = collection
				break
			}
		}

		if (book == null) {
			this.router.navigate(['author'])
			return
		}

		this.book.collection = book.collection
		this.book.title = book.title
		this.book.description = book.description ?? ""
		this.book.language = book.language
		this.book.price = book.price
		this.book.isbn = book.isbn ?? ""
		this.book.status = book.status
		this.book.coverBlurhash = book.cover?.blurhash
		this.book.fileName = book.file?.fileName
		this.bookFileUploaded = book.file != null

		// Get the categories
		await this.dataService.categoriesPromiseHolder.AwaitResult()
		this.LoadCategories(book.categories)

		this.priceInput.SetPrice(this.book.price)
		this.isbnInput.SetIsbn(this.book.isbn)

		await book.GetCoverContent().then(result => {
			if (result != null) this.coverContent = result
		})

		await this.LoadBackButtonLink()
	}

	async LoadBackButtonLink() {
		let singleBookInCollection = (await this.collection.GetStoreBooks()).length == 1

		if (singleBookInCollection && this.dataService.userIsAdmin) {
			this.backButtonLink = `/author/${this.author.uuid}`
		} else if (singleBookInCollection) {
			this.backButtonLink = "/author"
		} else if (this.dataService.userIsAdmin) {
			this.backButtonLink = `/author/${this.author.uuid}/collection/${this.book.collection}`
		} else {
			this.backButtonLink = `/author/collection/${this.book.collection}`
		}
	}

	BackButtonClick() {
		this.router.navigate([this.backButtonLink])
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
			this.author.ClearSeries()
			this.collection.ClearStoreBooks()

			this.cachingService.ClearApiRequestCache(
				this.apiService.RetrieveStoreBook.name,
				this.apiService.RetrieveStoreBookCover.name
			)
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
		} else {
			// Show error
			this.errorMessage = this.locale.errors.unexpectedErrorLong
		}
	}

	async PublishOrUnpublishBook(status: string) {
		this.publishingOrUnpublishing = true
		this.statusLoading = true

		this.UpdateStoreBookResponse(
			await this.apiService.UpdateStoreBook({
				uuid: this.uuid,
				status,
				fields: [StoreBookField.status]
			})
		)

		// Clear the ApiCache for GetStoreBook and GetStoreBooksInReview
		this.cachingService.ClearApiRequestCache(this.apiService.RetrieveStoreBook.name)
		this.cachingService.ClearApiRequestCache(this.apiService.ListStoreBooks.name)
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
		} else if (this.publishingOrUnpublishing) {
			this.publishingOrUnpublishing = false
			this.statusLoading = false

			if (isSuccessStatusCode(response.status)) {
				this.book.status = GetBookStatusByString((response as ApiResponse<StoreBookResource>).data.status)
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
			this.author.ClearSeries()
			this.collection.ClearStoreBooks()

			this.cachingService.ClearApiRequestCache(
				this.apiService.RetrieveStoreBook.name,
				this.apiService.RetrieveStoreBookCover.name
			)
		}
	}
}