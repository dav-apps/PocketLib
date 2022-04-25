import { Component } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { DataService, FindAppropriateLanguage } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { CachingService } from 'src/app/services/caching-service'
import { Author } from 'src/app/models/Author'
import { StoreBookCollection } from 'src/app/models/StoreBookCollection'
import { GetDualScreenSettings, GetLanguageByString } from 'src/app/misc/utils'
import { BookListItem, StoreBookReleaseResource } from 'src/app/misc/types'
import { enUS } from 'src/locales/locales'

interface ExtendedBookListItem extends BookListItem {
	releases: StoreBookReleaseResource[]
}

@Component({
	selector: 'pocketlib-author-collection-page',
	templateUrl: './author-collection-page.component.html'
})
export class AuthorCollectionPageComponent {
	locale = enUS.authorCollectionPage
	uuid: string
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	author: Author
	collection: StoreBookCollection = new StoreBookCollection(null, this.apiService, this.cachingService)
	books: ExtendedBookListItem[] = []
	leftScreenBooks: ExtendedBookListItem[] = []
	rightScreenBooks: ExtendedBookListItem[] = []
	names: { name: string, language: string }[] = []
	collectionName: { name: string, language: string } = { name: "", language: "" }
	collectionNames: { name: string, language: string, fullLanguage: string, edit: boolean }[] = []
	namesDialogVisible: boolean = false
	showAddLanguageButton: boolean = false
	newBookPageLink: {
		path: string,
		params: any
	} = { path: "/author/book/new", params: {} }
	bookLink: string = ""
	releasesLink: string = ""
	backButtonLink: string = "/author"

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private cachingService: CachingService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().authorCollectionPage

		// Check if this is a dual-screen device with a vertical fold
		let dualScreenSettings = GetDualScreenSettings()
		this.dualScreenLayout = dualScreenSettings.dualScreenLayout
		this.dualScreenFoldMargin = dualScreenSettings.dualScreenFoldMargin
	}

	async ngOnInit() {
		// Wait for the user to be loaded
		await this.dataService.userPromiseHolder.AwaitResult()
		await this.dataService.userAuthorPromiseHolder.AwaitResult()
		await this.dataService.adminAuthorsPromiseHolder.AwaitResult()

		if (this.dataService.userIsAdmin) {
			// Get the author
			let authorUuid = this.activatedRoute.snapshot.paramMap.get("author_uuid")
			this.author = this.dataService.adminAuthors.find(a => a.uuid == authorUuid)
			this.newBookPageLink.path = `/author/${this.author.uuid}/book/new`
			this.bookLink = `/author/${this.author.uuid}/book/{0}`
			this.releasesLink = `/author/${this.author.uuid}/book/{0}/releases`
			this.backButtonLink = `/author/${this.author.uuid}`
		} else if (this.dataService.userAuthor) {
			this.author = this.dataService.userAuthor
			this.bookLink = `/author/book/{0}`
			this.releasesLink = `/author/book/{0}/releases`
		}

		if (this.author == null) {
			this.router.navigate(['author'])
			return
		}

		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get("collection_uuid")
		this.newBookPageLink.params["collection"] = this.uuid

		// Get the collection
		this.collection = (await this.author.GetCollections()).find(c => c.uuid == this.uuid)

		if (this.collection == null) {
			this.router.navigate(['author'])
			return
		}

		this.collectionName.name = this.collection.name.value
		this.collectionName.language = this.collection.name.language

		let i = 0

		for (let storeBook of await this.collection.GetStoreBooks()) {
			let bookItem: ExtendedBookListItem = {
				uuid: storeBook.uuid,
				title: storeBook.title,
				coverContent: null,
				coverBlurhash: storeBook.cover?.blurhash,
				releases: []
			}

			storeBook.GetCoverContent().then(result => {
				if (result != null) bookItem.coverContent = result
			})

			storeBook.GetReleases().then(result => {
				bookItem.releases = result
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

	BackButtonClick() {
		this.router.navigate([this.backButtonLink])
	}

	async ShowNamesDialog() {
		await this.LoadCollectionNames()
		this.namesDialogVisible = true
	}

	async LoadCollectionNames() {
		// Update the collection names for the EditNames component
		this.collectionNames = []

		for (let collectionName of await this.collection.GetNames()) {
			this.collectionNames.push({
				name: collectionName.name,
				language: collectionName.language,
				fullLanguage: this.dataService.GetFullLanguage(GetLanguageByString(collectionName.language)),
				edit: false
			})
		}
	}

	UpdateCollectionName(collectionName: { name: string, language: string }) {
		if (this.collectionName.language == collectionName.language) {
			// Update the title
			this.collectionName.name = collectionName.name
		} else {
			let i = this.names.findIndex(name => name.language == collectionName.language)

			if (i == -1) {
				// Add the name to the names of the collection
				this.names.push(collectionName)

				// Update the title if the name for the current language was added
				let j = FindAppropriateLanguage(this.dataService.supportedLocale, this.names)
				if (j != -1) this.collectionName = this.names[j]
			} else {
				// Update the name in the collection
				this.names[i].name = collectionName.name
			}
		}

		this.collection.ClearNames()
		this.LoadCollectionNames()
	}
}