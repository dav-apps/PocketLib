import { Component } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { isSuccessStatusCode } from "dav-js"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { RoutingService } from "src/app/services/routing-service"
import {
	List,
	ApiResponse,
	StoreBookResource,
	StoreBooksPageContext
} from "src/app/misc/types"
import { enUS } from "src/locales/locales"
import { ApolloQueryResult } from "@apollo/client"

interface BookItem {
	uuid: string
	slug: string
	coverContent: string
	blurhash: string
	title: string
}

@Component({
	templateUrl: "./store-books-page.component.html",
	styleUrls: ["./store-books-page.component.scss"]
})
export class StoreBooksPageComponent {
	locale = enUS.storeBooksPage
	header: string = ""
	books: BookItem[] = []

	//#region Variables for pagination
	pages: number = 1
	maxVisibleBooks: number = 12
	//#endregion

	//#region Variables for UpdateView
	context: StoreBooksPageContext = StoreBooksPageContext.Category
	key: string = ""
	page: number = 1
	//#endregion

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private routingService: RoutingService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().storeBooksPage
		this.dataService.simpleLoadingScreenVisible = true
		this.key = this.activatedRoute.snapshot.paramMap.get("key")

		if (this.key == "all") {
			this.context = StoreBooksPageContext.AllBooks
		}

		this.UpdateView()

		this.activatedRoute.url.subscribe(async () => {
			let urlSegments = this.activatedRoute.snapshot.url
			if (urlSegments.length == 0) return

			if (this.activatedRoute.snapshot.queryParamMap.has("page")) {
				this.page = +this.activatedRoute.snapshot.queryParamMap.get("page")
			} else {
				this.page = 1
			}
		})
	}

	BackButtonClick() {
		this.routingService.NavigateBack("/store")
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
		this.dataService.simpleLoadingScreenVisible = true

		let response: ApolloQueryResult<{
			listStoreBooks: List<StoreBookResource>
		}> = null

		switch (this.context) {
			case StoreBooksPageContext.Category:
				// Show the selected category
				response = await this.apiService.listStoreBooks(
					`
						total
						items {
							uuid
							slug
							title
							cover {
								url
								blurhash
							}
						}
					`,
					{
						categories: [this.key],
						languages: await this.dataService.GetStoreLanguages(),
						limit: this.maxVisibleBooks,
						offset: (this.page - 1) * this.maxVisibleBooks
					}
				)
				break
			default:
				// Show all books
				response = await this.apiService.listStoreBooks(
					`
						total
						items {
							uuid
							slug
							title
							cover {
								url
								blurhash
							}
						}
					`,
					{
						languages: await this.dataService.GetStoreLanguages(),
						limit: this.maxVisibleBooks,
						offset: (this.page - 1) * this.maxVisibleBooks
					}
				)
				break
		}

		this.dataService.simpleLoadingScreenVisible = false

		let responseData = response.data.listStoreBooks
		if (responseData == null) return

		let responseBooks = responseData.items
		this.pages = Math.ceil(responseData.total / this.maxVisibleBooks)

		for (let storeBook of responseBooks) {
			let bookItem: BookItem = {
				uuid: storeBook.uuid,
				slug: storeBook.slug,
				coverContent: this.dataService.defaultStoreBookCover,
				blurhash: storeBook.cover?.blurhash || "",
				title: storeBook.title
			}

			if (storeBook.cover?.url != null) {
				this.apiService
					.downloadFile(storeBook.cover.url)
					.then((fileResponse: ApiResponse<string>) => {
						if (isSuccessStatusCode(fileResponse.status)) {
							bookItem.coverContent = (
								fileResponse as ApiResponse<string>
							).data
						}
					})
			}

			this.books.push(bookItem)
		}
	}

	PageChange(page: number) {
		this.page = page
		this.router.navigate([], { queryParams: { page } })
		this.UpdateView()
	}

	bookItemClick(event: Event, bookItem: BookItem) {
		event.preventDefault()
		this.router.navigate(["store", "book", bookItem.uuid])
	}
}
