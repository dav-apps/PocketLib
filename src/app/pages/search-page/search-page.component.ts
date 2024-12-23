import { Component, ElementRef, ViewChild } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { faMagnifyingGlass } from "@fortawesome/pro-light-svg-icons"
import { ApiService } from "src/app/services/api-service"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"
import { SettingsService } from "src/app/services/settings-service"
import { VisitedBook } from "src/app/misc/types"

interface BookItem {
	uuid: string
	slug: string
	title: string
	author: string
	coverUrl: string
	href: string
}

@Component({
	templateUrl: "./search-page.component.html",
	styleUrl: "./search-page.component.scss",
	standalone: false
})
export class SearchPageComponent {
	locale = this.localizationService.locale.searchPage
	faMagnifyingGlass = faMagnifyingGlass
	books: BookItem[] = []
	debounceTimeoutId: number = 0
	isLoading: boolean = false
	query: string = ""
	pages: number = 1
	page: number = 1
	maxVisibleBooks: number = 12
	searchQueries: string[] = []
	visitedBooks: VisitedBook[] = []

	@ViewChild("searchInput") searchInput: ElementRef<HTMLInputElement>

	constructor(
		private apiService: ApiService,
		private dataService: DataService,
		private localizationService: LocalizationService,
		private settingsService: SettingsService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.dataService.setMeta()

		this.activatedRoute.url.subscribe(() => {
			if (this.activatedRoute.snapshot.queryParamMap.has("page")) {
				this.page = +this.activatedRoute.snapshot.queryParamMap.get("page")
			}

			if (this.activatedRoute.snapshot.queryParamMap.has("query")) {
				this.query = this.activatedRoute.snapshot.queryParamMap.get("query")
			}

			this.triggerSearch()
		})
	}

	async ngOnInit() {
		await this.loadSearchQueries()
		await this.loadVisitedBooks()
	}

	searchQueryChange() {
		this.query = this.searchInput.nativeElement.value
		this.page = 1
		this.triggerSearch()
	}

	pageChange(event: CustomEvent) {
		this.page = event.detail.page
		this.triggerSearch()
	}

	async loadSearchQueries() {
		this.searchQueries = (
			await this.settingsService.getSearchQueries()
		).slice(0, 5)
	}

	async loadVisitedBooks() {
		this.visitedBooks = (await this.settingsService.getVisitedBooks()).slice(
			0,
			10
		)
	}

	triggerSearch() {
		this.books = []

		if (this.query.length == 0) {
			this.pages = 1
			this.page = 1
			this.updateUrl()
			return
		}

		this.isLoading = true
		this.dataService.contentContainer.scrollTo({ top: 0 })

		if (this.debounceTimeoutId != 0) {
			window.clearTimeout(this.debounceTimeoutId)
		}

		this.debounceTimeoutId = window.setTimeout(async () => {
			let result = await this.apiService.search(
				`
					total
					items {
						... on VlbItem {
							uuid
							slug
							title
							coverUrl
							author {
								firstName
								lastName
							}
						}
					}
				`,
				{
					query: this.query,
					limit: this.maxVisibleBooks,
					offset: (this.page - 1) * this.maxVisibleBooks
				}
			)

			for (let item of result.data.search.items) {
				this.books.push({
					uuid: item.uuid,
					slug: item.slug,
					title: item.title,
					author: item.author
						? `${item.author.firstName} ${item.author.lastName}`
						: "",
					coverUrl: item.coverUrl,
					href: `/store/book/${item.slug}`
				})
			}

			this.isLoading = false
			this.pages = Math.ceil(result.data.search.total / this.maxVisibleBooks)
			this.updateUrl()
		}, 500)
	}

	updateUrl() {
		this.router.navigate([], {
			queryParams: { query: this.query, page: this.page }
		})
	}

	async bookItemClick(event: Event, book: BookItem) {
		event.preventDefault()

		await this.settingsService.addSearchQuery(this.query)

		this.router.navigate(["store", "book", book.slug])
	}

	async searchQueryClick(searchQuery: string) {
		this.query = searchQuery
		this.page = 1
		this.triggerSearch()

		await this.settingsService.addSearchQuery(this.query)
	}

	async searchQueryCloseButtonClick(searchQuery: string) {
		this.settingsService.removeSearchQuery(searchQuery)
		await this.loadSearchQueries()
	}
}
