import { Component, HostListener } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { ApiResponse, ApiErrorResponse } from 'dav-js'
import { DataService } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { BookListItem } from 'src/app/misc/types'
import { GetDualScreenSettings, AdaptCoverWidthHeightToAspectRatio } from 'src/app/misc/utils'
import { enUS } from 'src/locales/locales'

@Component({
	templateUrl: './store-books-page.component.html'
})
export class StoreBooksPageComponent {
	locale = enUS.storeBooksPage
	header: string = ""
	books: BookListItem[] = []
	leftScreenBooks: BookListItem[] = []
	rightScreenBooks: BookListItem[] = []
	width: number = 500
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	loading: boolean = false

	//#region Variables for pagination
	pages: number = 1
	paginationCollectionSize: number = 1
	maxVisibleBooks: number = 20
	//#endregion

	//#region Variables for UpdateView
	context: StoreBooksPageContext = StoreBooksPageContext.Category
	key: string = ""
	page: number = 1
	//#endregion

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().storeBooksPage

		// Check if this is a dual-screen device with a vertical fold
		let dualScreenSettings = GetDualScreenSettings()
		this.dualScreenLayout = dualScreenSettings.dualScreenLayout
		this.dualScreenFoldMargin = dualScreenSettings.dualScreenFoldMargin

		this.activatedRoute.url.subscribe(async () => {
			let urlSegments = this.activatedRoute.snapshot.url
			if (urlSegments.length == 0) return

			if (this.activatedRoute.snapshot.queryParamMap.has("page")) {
				this.page = +this.activatedRoute.snapshot.queryParamMap.get("page")
			} else {
				this.page = 1
			}

			switch (urlSegments[0].path) {
				case "category":
					// Show the selected category
					this.key = this.activatedRoute.snapshot.paramMap.get('key')
					this.context = StoreBooksPageContext.Category
					await this.UpdateView()
					break
				default:
					// Show all books
					this.context = StoreBooksPageContext.AllBooks
					await this.UpdateView()
					break
			}

			setTimeout(() => {
				this.setSize()
			}, 1)
		})
	}

	ngAfterViewInit() {
		this.setSize()
	}

	@HostListener('window:resize')
	setSize() {
		this.width = window.innerWidth
	}

	async UpdateView() {
		if (this.context == StoreBooksPageContext.Category) {
			if (!this.key) return

			// Get the selected category
			await this.dataService.categoriesPromiseHolder.AwaitResult()
			let category = this.dataService.categories.find(c => c.key == this.key)
			if (!category) return

			this.header = category.name
		} else {
			if (!this.page) return
			this.header = this.locale.allBooksTitle
		}

		// Get the books of the appropriate context
		this.books = []
		this.leftScreenBooks = []
		this.rightScreenBooks = []
		this.loading = true

		let response: ApiResponse<any> | ApiErrorResponse
		let responseBooks: any[] = []

		switch (this.context) {
			case StoreBooksPageContext.Category:
				// Show the selected category
				response = await this.apiService.GetStoreBooksByCategory({
					keys: [this.key],
					languages: await this.dataService.GetStoreLanguages(),
					limit: this.maxVisibleBooks,
					page: this.page
				})
				break
			default:
				// Show all books
				response = await this.apiService.GetLatestStoreBooks({
					languages: await this.dataService.GetStoreLanguages(),
					limit: this.maxVisibleBooks,
					page: this.page
				})
				break
		}

		this.loading = false

		if (response.status != 200) return
		let responseData = (response as ApiResponse<any>).data

		responseBooks = responseData.books
		this.pages = responseData.pages
		this.paginationCollectionSize = this.pages * this.maxVisibleBooks

		let i = 0
		for (let storeBook of responseBooks) {
			// Calculate the width and height
			let height = 230
			let width = AdaptCoverWidthHeightToAspectRatio(153, height, storeBook.cover_aspect_ratio)

			let bookItem: BookListItem = {
				uuid: storeBook.uuid,
				title: storeBook.title,
				cover: storeBook.cover,
				coverContent: null,
				coverBlurhash: storeBook.cover_blurhash,
				coverWidth: width,
				coverHeight: height
			}

			this.apiService.GetStoreBookCover({ uuid: storeBook.uuid }).then((result: ApiResponse<string>) => {
				bookItem.coverContent = result.data
			})

			if (this.dualScreenLayout) {
				// Evenly distribute the books on the left and right screens
				if (i % 2 == 0) {
					this.leftScreenBooks.push(bookItem)
				} else {
					this.rightScreenBooks.push(bookItem)
				}

				i++
			} else {
				this.books.push(bookItem)
			}
		}
	}

	PageChange(page: number) {
		this.page = page
		this.router.navigate([], { queryParams: { page } })
		this.UpdateView()
	}
}

enum StoreBooksPageContext {
	Category,
	AllBooks
}