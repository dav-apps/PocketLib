import { Component, ViewChild } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { ReadFile } from 'ngx-file-helpers'
import { ApiErrorResponse, ApiResponse } from 'dav-js'
import { DataService } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { CachingService } from 'src/app/services/caching-service'
import { CategoriesSelectionComponent } from 'src/app/components/categories-selection/categories-selection.component'
import { PriceInputComponent } from 'src/app/components/price-input/price-input.component'
import { IsbnInputComponent } from 'src/app/components/isbn-input/isbn-input.component'
import * as ErrorCodes from 'src/constants/errorCodes'
import { Author, BookStatus } from 'src/app/misc/types'
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
	backButtonLink: string = ""

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

		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid')
	}

	async ngOnInit() {
		// Wait for the user to be loaded
		await this.dataService.userPromiseHolder.AwaitResult()
		await this.dataService.userAuthorPromiseHolder.AwaitResult()
		await this.dataService.adminAuthorsPromiseHolder.AwaitResult()

		// Redirect back to the author page if the user is not an author
		if (!this.dataService.userAuthor && !this.dataService.userIsAdmin) {
			this.router.navigate(['author'])
		}

		// Get the store book
		let response = await this.apiService.GetStoreBook({
			uuid: this.uuid
		})

		if (response.status == 200) {
			let responseData = (response as ApiResponse<any>).data

			this.book.collection = responseData.collection
			this.book.title = responseData.title
			this.book.description = responseData.description
			this.book.language = responseData.language
			this.book.price = responseData.price
			this.book.isbn = responseData.isbn ? responseData.isbn : ""
			this.book.status = GetBookStatusByString(responseData.status)
			this.book.coverBlurhash = responseData.cover_blurhash
			this.book.fileName = responseData.file_name
			this.bookFileUploaded = responseData.file

			// Get the categories
			await this.dataService.categoriesPromiseHolder.AwaitResult()
			this.LoadCategories(responseData.categories)

			this.priceInput.SetPrice(this.book.price)
			this.isbnInput.SetIsbn(this.book.isbn)

			if (responseData.cover) {
				let coverResponse = await this.apiService.GetStoreBookCover({ uuid: this.uuid })
				if (coverResponse.status == 200) this.coverContent = (coverResponse as ApiResponse<any>).data
			}
		} else {
			// Redirect back to the author page
			this.router.navigate(['author'])
		}

		await this.LoadBackButtonLink()
	}

	async LoadBackButtonLink() {
		let author: Author
		let singleBookInCollection = true

		// Try to find the author of the collection of the book
		if (this.dataService.userIsAdmin) {
			author = this.dataService.adminAuthors.find(author => author.collections.findIndex(collection => collection.uuid == this.book.collection) != -1)
		} else {
			author = this.dataService.userAuthor
		}

		if (author != null) {
			// Load the books of the collections
			await this.apiService.LoadCollectionsOfAuthor(author)

			// Find the collection of the current book
			let collection = author.collections.find(c => c.uuid == this.book.collection)
			singleBookInCollection = collection.books.length == 1

			if (singleBookInCollection && this.dataService.userIsAdmin) {
				this.backButtonLink = `/author/${author.uuid}`
			} else if (singleBookInCollection) {
				this.backButtonLink = "/author"
			} else {
				this.backButtonLink = `/author/collection/${this.book.collection}`
			}
		} else {
			this.backButtonLink = "/author"
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
		this.editTitleDialogVisible = true
	}

	async UpdateTitle() {
		this.UpdateStoreBookResponse(
			await this.apiService.UpdateStoreBook({
				uuid: this.uuid,
				title: this.editTitleDialogTitle
			})
		)
	}

	async EditDescription() {
		if (this.editDescription) {
			this.newDescriptionError = ""
			this.descriptionLoading = true

			//	Save the new description on the server
			this.UpdateStoreBookResponse(
				await this.apiService.UpdateStoreBook({
					uuid: this.uuid,
					description: this.newDescription
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
				language
			})
		)
	}

	ShowCategoriesDialog() {
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

		// Update the categories on the server
		await this.apiService.UpdateStoreBook({
			uuid: this.uuid,
			categories
		})

		this.LoadCategories(categories)
		this.categoriesSelectionDialogVisible = false
	}

	async UpdatePrice(price: number) {
		this.priceUpdating = true

		this.UpdateStoreBookResponse(
			await this.apiService.UpdateStoreBook({
				uuid: this.uuid,
				price
			})
		)
	}

	async UpdateIsbn(isbn: string) {
		this.isbnUpdating = true

		this.UpdateStoreBookResponse(
			await this.apiService.UpdateStoreBook({
				uuid: this.uuid,
				isbn
			})
		)
	}

	async CoverUpload(file: ReadFile) {
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
		await this.apiService.SetStoreBookCover({
			uuid: this.uuid,
			type: file.type,
			file: imageContent
		})

		this.coverLoading = false
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
		let response = await this.apiService.SetStoreBookFile({
			uuid: this.uuid,
			type: file.type,
			name: file.name,
			file: fileContent
		})

		this.bookFileUploaded = response.status == 200
		this.bookFileLoading = false

		if (response.status == 200) {
			this.book.fileName = file.name
		}
	}

	async PublishOrUnpublishBook(published: boolean) {
		this.publishingOrUnpublishing = true
		this.statusLoading = true

		this.UpdateStoreBookResponse(
			await this.apiService.UpdateStoreBook({
				uuid: this.uuid,
				published
			})
		)

		// Clear the ApiCache for GetStoreBook and GetStoreBooksInReview
		this.cachingService.ClearApiRequestCache(this.apiService.GetStoreBook.name)
		this.cachingService.ClearApiRequestCache(this.apiService.GetStoreBooksInReview.name)
	}

	UpdateStoreBookResponse(response: ApiResponse<any> | ApiErrorResponse) {
		if (this.editDescription) {
			// The description was updated
			if (response.status == 200) {
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

			if (response.status == 200) {
				this.book.language = (response as ApiResponse<any>).data.language
			}
		} else if (this.priceUpdating) {
			this.priceUpdating = false

			// The price was updated
			if (response.status == 200) {
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
			if (response.status == 200) {
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

			if (response.status == 200) {
				this.book.status = GetBookStatusByString((response as ApiResponse<any>).data.status)
			}
		} else {
			// The title was updated
			if (response.status == 200) {
				this.book.title = (response as ApiResponse<any>).data.title
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
	}
}