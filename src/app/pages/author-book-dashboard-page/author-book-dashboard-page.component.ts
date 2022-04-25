import { Component } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { DataService } from "src/app/services/data-service"
import { Author } from "src/app/models/Author"
import { StoreBook } from "src/app/models/StoreBook"
import { StoreBookCollection } from "src/app/models/StoreBookCollection"

@Component({
	templateUrl: "./author-book-dashboard-page.component.html"
})
export class AuthorBookDashboardPageComponent {
	author: Author
	collection: StoreBookCollection
	book: StoreBook
	title: string = ""
	backButtonLink: string = "/author"

	constructor(
		public dataService: DataService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) { }

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

		// Get the store book
		let storeBookUuid = this.activatedRoute.snapshot.paramMap.get("book_uuid")

		for (let collection of await this.author.GetCollections()) {
			this.book = (await collection.GetStoreBooks()).find(b => b.uuid == storeBookUuid)

			if (this.book != null) {
				this.collection = collection
				break
			}
		}

		if (this.book == null) {
			this.router.navigate(['author'])
			return
		}

		this.title = this.book.title
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
}