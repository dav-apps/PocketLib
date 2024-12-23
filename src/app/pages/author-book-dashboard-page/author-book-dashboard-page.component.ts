import { Component } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { LocalizationService } from "src/app/services/localization-service"
import { SettingsService } from "src/app/services/settings-service"
import { Author } from "src/app/models/Author"
import { StoreBook } from "src/app/models/StoreBook"
import { StoreBookCollection } from "src/app/models/StoreBookCollection"
import { StoreBookStatus } from "src/app/misc/types"

@Component({
	templateUrl: "./author-book-dashboard-page.component.html",
	styleUrl: "./author-book-dashboard-page.component.scss",
	standalone: false
})
export class AuthorBookDashboardPageComponent {
	locale = this.localizationService.locale.authorBookDashboardPage
	author: Author
	collection: StoreBookCollection
	book: StoreBook
	title: string = ""
	status: StoreBookStatus = StoreBookStatus.Unpublished
	loading: boolean = false
	backButtonLink: string = "/author"

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private localizationService: LocalizationService,
		private settingsService: SettingsService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.dataService.setMeta()
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
					await this.settingsService.getStoreLanguages(
						this.dataService.locale
					),
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

		// Get the store book
		let storeBookUuid = this.activatedRoute.snapshot.paramMap.get("book_uuid")

		this.book = await StoreBook.Retrieve(
			storeBookUuid,
			await this.settingsService.getStoreLanguages(this.dataService.locale),
			this.apiService
		)

		if (this.book == null) {
			this.router.navigate(["author"])
			return
		}

		this.title = this.book.title
		this.status = this.book.status
		this.collection = await this.book.GetCollection()

		await this.LoadBackButtonLink()
	}

	async LoadBackButtonLink() {
		let storeBooksResult = await this.collection.GetStoreBooks()
		let singleBookInCollection = storeBooksResult.total == 1

		if (singleBookInCollection && this.dataService.userIsAdmin) {
			this.backButtonLink = `/author/${this.author.uuid}`
		} else if (singleBookInCollection) {
			this.backButtonLink = "/author"
		} else if (this.dataService.userIsAdmin) {
			this.backButtonLink = `/author/${this.author.uuid}/collection/${this.collection.uuid}`
		} else {
			this.backButtonLink = `/author/collection/${this.collection.uuid}`
		}
	}

	BackButtonClick() {
		this.router.navigate([this.backButtonLink])
	}

	ShowDetailsButtonClick() {
		if (this.dataService.userIsAdmin) {
			this.router.navigate([
				"author",
				this.author.uuid,
				"book",
				this.book.uuid,
				"details"
			])
		} else {
			this.router.navigate(["author", "book", this.book.uuid, "details"])
		}
	}

	ShowReleasesButtonClick() {
		if (this.dataService.userIsAdmin) {
			this.router.navigate([
				"author",
				this.author.uuid,
				"book",
				this.book.uuid,
				"releases"
			])
		} else {
			this.router.navigate(["author", "book", this.book.uuid, "releases"])
		}
	}

	async CancelPublishingButtonClick() {
		this.loading = true

		let response = await this.apiService.updateStoreBook(`uuid`, {
			uuid: this.book.uuid,
			status: "unpublished"
		})

		if (response.errors == null) {
			//this.collection.ClearStoreBooks()

			if (this.dataService.userIsAdmin) {
				this.router.navigate([
					"author",
					this.author.uuid,
					"book",
					this.book.uuid,
					"details"
				])
			} else {
				this.router.navigate(["author", "book", this.book.uuid, "details"])
			}
		} else {
			this.loading = false
		}
	}

	async PublishButtonClick() {
		this.loading = true

		let response = await this.apiService.updateStoreBook(`uuid`, {
			uuid: this.book.uuid,
			status: "published"
		})

		if (response.errors == null) {
			this.status = StoreBookStatus.Published
			//this.collection.ClearStoreBooks()
		}

		this.loading = false
	}

	async UnpublishButtonClick() {
		this.loading = true

		let response = await this.apiService.updateStoreBook(`uuid`, {
			uuid: this.book.uuid,
			status: "hidden"
		})

		if (response.errors == null) {
			this.status = StoreBookStatus.Hidden
			//this.collection.ClearStoreBooks()
		}

		this.loading = false
	}
}
