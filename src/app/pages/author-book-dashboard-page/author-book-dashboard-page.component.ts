import { Component } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { DataService } from "src/app/services/data-service"
import { GraphQLService } from "src/app/services/graphql-service"
import { Author } from "src/app/models/Author"
import { StoreBook } from "src/app/models/StoreBook"
import { StoreBookCollection } from "src/app/models/StoreBookCollection"
import { StoreBookStatus } from "src/app/misc/types"
import { enUS } from "src/locales/locales"

@Component({
	templateUrl: "./author-book-dashboard-page.component.html"
})
export class AuthorBookDashboardPageComponent {
	locale = enUS.authorBookDashboardPage
	author: Author
	collection: StoreBookCollection
	book: StoreBook
	title: string = ""
	status: StoreBookStatus = StoreBookStatus.Unpublished
	loading: boolean = false
	backButtonLink: string = "/author"

	constructor(
		public dataService: DataService,
		private graphqlService: GraphQLService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().authorBookDashboardPage
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
				for (let publisher of this.dataService.adminPublishers) {
					this.author = (await publisher.GetAuthors()).find(
						a => a.uuid == authorUuid
					)
					if (this.author != null) break
				}
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

		for (let collection of await this.author.GetCollections()) {
			this.book = (await collection.GetStoreBooks()).find(
				b => b.uuid == storeBookUuid
			)

			if (this.book != null) {
				this.collection = collection
				break
			}
		}

		if (this.book == null) {
			this.router.navigate(["author"])
			return
		}

		this.title = this.book.title
		this.status = this.book.status
		await this.LoadBackButtonLink()
	}

	async LoadBackButtonLink() {
		let singleBookInCollection =
			(await this.collection.GetStoreBooks()).length == 1

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

		let response = await this.graphqlService.updateStoreBook(`uuid`, {
			uuid: this.book.uuid,
			status: "unpublished"
		})

		if (response.errors == null) {
			this.collection.ClearStoreBooks()

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

		let response = await this.graphqlService.updateStoreBook(`uuid`, {
			uuid: this.book.uuid,
			status: "published"
		})

		if (response.errors == null) {
			this.status = StoreBookStatus.Published
			this.collection.ClearStoreBooks()
		}

		this.loading = false
	}

	async UnpublishButtonClick() {
		this.loading = true

		let response = await this.graphqlService.updateStoreBook(`uuid`, {
			uuid: this.book.uuid,
			status: "hidden"
		})

		if (response.errors == null) {
			this.status = StoreBookStatus.Hidden
			this.collection.ClearStoreBooks()
		}

		this.loading = false
	}
}
