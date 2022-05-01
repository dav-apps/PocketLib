import { Component } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { faAngleRight } from "@fortawesome/pro-light-svg-icons"
import { DataService } from "src/app/services/data-service"
import { Author } from "src/app/models/Author"
import { StoreBook } from "src/app/models/StoreBook"
import { StoreBookCollection } from "src/app/models/StoreBookCollection"
import { StoreBookReleaseStatus } from "src/app/misc/types"

interface ReleaseItem {
	name: string
	link: string
}

@Component({
	templateUrl: "./author-releases-page.component.html"
})
export class AuthorReleasesPageComponent {
	faAngleRight = faAngleRight
	author: Author
	collection: StoreBookCollection
	book: StoreBook
	releaseItems: ReleaseItem[] = []
	title: string = ""

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

		// Get the store book releases
		let releases = await this.book.GetReleases()
		this.title = this.book.title

		for (let release of releases) {
			if (release.status == StoreBookReleaseStatus.Unpublished) continue

			let releaseItem: ReleaseItem = {
				name: release.releaseName,
				link: ""
			}

			if (this.dataService.userIsAdmin) {
				releaseItem.link = `/author/${this.author.uuid}/book/${this.book.uuid}/releases/${release.uuid}`
			} else {
				releaseItem.link = `/author/book/${this.book.uuid}/releases/${release.uuid}`
			}

			this.releaseItems.push(releaseItem)
		}
	}

	BackButtonClick() {
		if (this.dataService.userIsAdmin) {
			this.router.navigate(["author", this.author.uuid, "book", this.book.uuid])
		} else {
			this.router.navigate(["author", "book", this.book.uuid])
		}
	}
}