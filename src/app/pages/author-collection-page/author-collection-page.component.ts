import { Component, ViewChild } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { NamesDialogComponent } from "src/app/components/dialogs/names-dialog/names-dialog.component"
import {
	DataService,
	FindAppropriateLanguage
} from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { Author } from "src/app/models/Author"
import { StoreBookCollection } from "src/app/models/StoreBookCollection"
import { GetLanguageByString } from "src/app/misc/utils"
import { BookListItem, StoreBookStatus } from "src/app/misc/types"
import { enUS } from "src/locales/locales"

interface ExtendedBookListItem extends BookListItem {
	link: string
}

@Component({
	selector: "pocketlib-author-collection-page",
	templateUrl: "./author-collection-page.component.html",
	styleUrls: ["./author-collection-page.component.scss"]
})
export class AuthorCollectionPageComponent {
	locale = enUS.authorCollectionPage
	@ViewChild("namesDialog")
	namesDialog: NamesDialogComponent
	uuid: string
	author: Author
	collection: StoreBookCollection = new StoreBookCollection(
		null,
		this.dataService,
		this.apiService
	)
	books: ExtendedBookListItem[] = []
	leftScreenBooks: ExtendedBookListItem[] = []
	rightScreenBooks: ExtendedBookListItem[] = []
	names: { name: string; language: string }[] = []
	collectionName: { name: string; language: string } = {
		name: "",
		language: ""
	}
	collectionNames: {
		name: string
		language: string
		fullLanguage: string
		edit: boolean
	}[] = []
	showAddLanguageButton: boolean = false
	newBookPageLink: {
		path: string
		params: any
	} = { path: "/author/book/new", params: {} }

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().authorCollectionPage
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
					this.dataService,
					this.apiService
				)
			}

			this.newBookPageLink.path = `/author/${authorUuid}/book/new`
		} else if (this.dataService.userAuthor) {
			this.author = this.dataService.userAuthor
		}

		if (this.author == null) {
			this.router.navigate(["author"])
			return
		}

		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get("collection_uuid")
		this.newBookPageLink.params["collection"] = this.uuid

		// Get the collection
		this.collection = await StoreBookCollection.Retrieve(
			this.uuid,
			this.dataService,
			this.apiService
		)

		if (this.collection == null) {
			this.router.navigate(["author"])
			return
		}

		this.collectionName.name = this.collection.name.name
		this.collectionName.language = this.collection.name.language

		let i = 0
		let storeBooksResult = await this.collection.GetStoreBooks()

		for (let storeBook of storeBooksResult.items) {
			let bookItem: ExtendedBookListItem = {
				uuid: storeBook.uuid,
				title: storeBook.title,
				coverContent: null,
				coverBlurhash: storeBook.cover?.blurhash,
				link: ""
			}

			storeBook.GetCoverContent().then(result => {
				if (result != null) bookItem.coverContent = result
			})

			if (this.dataService.userIsAdmin) {
				if (storeBook.status == StoreBookStatus.Unpublished) {
					bookItem.link = `/author/${this.author.uuid}/book/${storeBook.uuid}/details`
				} else {
					bookItem.link = `/author/${this.author.uuid}/book/${storeBook.uuid}`
				}
			} else {
				if (storeBook.status == StoreBookStatus.Unpublished) {
					bookItem.link = `/author/book/${storeBook.uuid}/details`
				} else {
					bookItem.link = `/author/book/${storeBook.uuid}`
				}
			}

			this.books.push(bookItem)
		}
	}

	BackButtonClick() {
		if (this.dataService.userIsAdmin) {
			this.router.navigate(["author", this.author.uuid])
		} else {
			this.router.navigate(["author"])
		}
	}

	NavigateToNewBookPage() {
		this.router.navigate([this.newBookPageLink.path], {
			queryParams: this.newBookPageLink.params
		})
	}

	async ShowNamesDialog() {
		await this.LoadCollectionNames()
		this.namesDialog.show()
	}

	async LoadCollectionNames() {
		// Update the collection names for the EditNames component
		this.collectionNames = []
		let namesResult = await this.collection.GetNames()

		for (let collectionName of namesResult.items) {
			this.collectionNames.push({
				name: collectionName.name,
				language: collectionName.language,
				fullLanguage: this.dataService.GetFullLanguage(
					GetLanguageByString(collectionName.language)
				),
				edit: false
			})
		}
	}

	UpdateCollectionName(collectionName: { name: string; language: string }) {
		if (this.collectionName.language == collectionName.language) {
			// Update the title
			this.collectionName.name = collectionName.name
		} else {
			let i = this.names.findIndex(
				name => name.language == collectionName.language
			)

			if (i == -1) {
				// Add the name to the names of the collection
				this.names.push(collectionName)

				// Update the title if the name for the current language was added
				let j = FindAppropriateLanguage(
					this.dataService.supportedLocale,
					this.names
				)
				if (j != -1) this.collectionName = this.names[j]
			} else {
				// Update the name in the collection
				this.names[i].name = collectionName.name
			}
		}

		//this.collection.ClearNames()
		this.LoadCollectionNames()
	}

	bookItemClick(event: Event, bookItem: ExtendedBookListItem) {
		event.preventDefault()
		this.router.navigate([bookItem.link])
	}
}
