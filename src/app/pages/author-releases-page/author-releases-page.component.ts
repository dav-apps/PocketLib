import { Component } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { faAngleRight } from "@fortawesome/pro-light-svg-icons"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { SettingsService } from "src/app/services/settings-service"
import { Author } from "src/app/models/Author"
import { StoreBook } from "src/app/models/StoreBook"
import { StoreBookCollection } from "src/app/models/StoreBookCollection"
import { StoreBookReleaseStatus } from "src/app/misc/types"

interface ReleaseItem {
	uuid: string
	name: string
	link: string
}

@Component({
	templateUrl: "./author-releases-page.component.html",
	styleUrls: ["./author-releases-page.component.scss"]
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
		public apiService: ApiService,
		private settingsService: SettingsService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {}

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
		this.collection = await this.book.GetCollection()

		// Get the store book releases
		let releasesResult = await this.book.GetReleases()

		for (let release of releasesResult.items) {
			if (release.status == StoreBookReleaseStatus.Unpublished) continue

			let releaseItem: ReleaseItem = {
				uuid: release.uuid,
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
			this.router.navigate([
				"author",
				this.author.uuid,
				"book",
				this.book.uuid
			])
		} else {
			this.router.navigate(["author", "book", this.book.uuid])
		}
	}

	releaseItemClick(event: Event, releaseItem: ReleaseItem) {
		event.preventDefault()
		this.router.navigate([releaseItem.link])
	}
}
