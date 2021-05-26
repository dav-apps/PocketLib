import { Component, ViewChild, ElementRef, HostListener } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { ApiResponse } from 'dav-js'
import { DataService, Category } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { BookListItem } from 'src/app/misc/types'
import { GetDualScreenSettings, GetElementHeight } from 'src/app/misc/utils'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'store-books-page',
	templateUrl: './store-books-page.component.html'
})
export class StoreBooksPageComponent {
	@ViewChild('container', { static: false }) container: ElementRef<HTMLDivElement>
	locale = enUS.storeBooksPage
	header: string = ""
	books: BookListItem[] = []
	leftScreenBooks: BookListItem[] = []
	rightScreenBooks: BookListItem[] = []
	width: number = 500
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	hoveredBookIndex: number = -1

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

			switch (urlSegments[0].path) {
				case "category":
					// Show the selected category
					let key = this.activatedRoute.snapshot.paramMap.get('key')
					await this.UpdateView(StoreBooksPageContext.Category, key)
					break
				default:
					// Show all books
					await this.UpdateView(StoreBooksPageContext.AllBooks)
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
		if (this.container) this.dataService.storePageContentHeight = GetElementHeight(this.container.nativeElement)
	}

	async UpdateView(context: StoreBooksPageContext, key?: string) {
		if (context == StoreBooksPageContext.Category) {
			// Get the selected category
			await this.dataService.categoriesPromiseHolder.AwaitResult()
			let category = this.dataService.categories.find(c => c.key == key)
			if (!category) return

			this.header = category.name
		} else {
			this.header = this.locale.allBooksHeader
		}

		// Get the books of the appropriate context
		this.books = []
		this.leftScreenBooks = []
		this.rightScreenBooks = []
		let responseBooks: any[] = []

		switch (context) {
			case StoreBooksPageContext.Category:
				// Show the selected category
				let getStoreBooksByCategoryResponse: ApiResponse<any> = await this.apiService.GetStoreBooksByCategory({
					key,
					languages: await this.dataService.GetStoreLanguages()
				})
				if (getStoreBooksByCategoryResponse.status != 200) return
				responseBooks = getStoreBooksByCategoryResponse.data.books
				break
			default:
				// Show all books
				let latestStoreBooksResponse: ApiResponse<any> = await this.apiService.GetLatestStoreBooks({ languages: await this.dataService.GetStoreLanguages() })
				if (latestStoreBooksResponse.status != 200) return
				responseBooks = latestStoreBooksResponse.data.books
				break
		}

		let i = 0
		for (let storeBook of responseBooks) {
			// Calculate the width and height
			let width = 178
			let height = 270

			if (storeBook.cover_aspect_ratio != null) {
				let parts = storeBook.cover_aspect_ratio.split(':')
				let widthAspectRatio = +parts[0]
				let heightAspectRatio = +parts[1]

				if (widthAspectRatio == 1) {
					// 1:2 -> 0.5:1
					widthAspectRatio /= heightAspectRatio
				}

				width = Math.round(height * widthAspectRatio)
			}

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

	NavigateToStoreBook(uuid: string) {
		this.router.navigate(["store", "book", uuid])
	}
}

enum StoreBooksPageContext {
	Category,
	AllBooks
}