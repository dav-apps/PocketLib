import { Component, ViewChild, ElementRef, HostListener } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { ApiResponse } from 'dav-js'
import { DataService, Category, GetStoreBookCoverLink } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { BookListItem } from 'src/app/misc/types'
import { GetDualScreenSettings, GetElementHeight } from 'src/app/misc/utils'

@Component({
	selector: 'store-books-page',
	templateUrl: './store-books-page.component.html'
})
export class StoreBooksPageComponent {
	@ViewChild('container', { static: false }) container: ElementRef<HTMLDivElement>
	category: Category = { key: "", name: "", language: "" }
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
		// Check if this is a dual-screen device with a vertical fold
		let dualScreenSettings = GetDualScreenSettings()
		this.dualScreenLayout = dualScreenSettings.dualScreenLayout
		this.dualScreenFoldMargin = dualScreenSettings.dualScreenFoldMargin

		this.activatedRoute.url.subscribe(async () => {
			let key = this.activatedRoute.snapshot.paramMap.get('key')
			await this.UpdateView(key)
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

	async UpdateView(key: string) {
		// Get the selected category
		await this.dataService.categoriesPromiseHolder.AwaitResult()
		this.category = this.dataService.categories.find(c => c.key == key)

		// Get the books of the category
		this.books = []
		this.leftScreenBooks = []
		this.rightScreenBooks = []
		let getStoreBooksByCategoryResponse: ApiResponse<any> = await this.apiService.GetStoreBooksByCategory({
			key,
			languages: await this.dataService.GetStoreLanguages()
		})

		let i = 0
		for (let storeBook of getStoreBooksByCategoryResponse.data.books) {
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

			let bookItem = {
				uuid: storeBook.uuid,
				title: storeBook.title,
				cover: storeBook.cover,
				coverContent: GetStoreBookCoverLink(storeBook.uuid),
				coverBlurhash: storeBook.cover_blurhash,
				coverWidth: width,
				coverHeight: height
			}

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