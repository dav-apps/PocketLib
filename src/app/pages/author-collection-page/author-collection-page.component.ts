import { Component } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { ApiErrorResponse, ApiResponse, isSuccessStatusCode } from 'dav-js'
import { DataService, FindAppropriateLanguage } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { CachingService } from 'src/app/services/caching-service'
import { StoreBookCollection } from 'src/app/models/StoreBookCollection'
import { GetDualScreenSettings, GetLanguageByString } from 'src/app/misc/utils'
import { BookListItem, AuthorMode } from 'src/app/misc/types'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-author-collection-page',
	templateUrl: './author-collection-page.component.html'
})
export class AuthorCollectionPageComponent {
	locale = enUS.authorCollectionPage
	uuid: string
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	authorMode: AuthorMode = AuthorMode.Normal
	collection: StoreBookCollection = new StoreBookCollection(null, this.apiService, this.cachingService)
	books: BookListItem[] = []
	leftScreenBooks: BookListItem[] = []
	rightScreenBooks: BookListItem[] = []
	names: { name: string, language: string }[] = []
	collectionName: { name: string, language: string } = { name: "", language: "" }
	collectionNames: { name: string, language: string, fullLanguage: string, edit: boolean }[] = []
	namesDialogVisible: boolean = false
	showAddLanguageButton: boolean = false
	newBookPageLink: {
		path: string,
		params: any
	} = { path: "/author/book/new", params: {} }
	backButtonLink: string = ""

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

		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid')
	}

	async ngOnInit() {
		// Wait for the user to be loaded
		await this.dataService.userPromiseHolder.AwaitResult()
		await this.dataService.userAuthorPromiseHolder.AwaitResult()
		await this.dataService.adminAuthorsPromiseHolder.AwaitResult()

		let collectionLoaded = false

		if (this.dataService.userIsAdmin) {
			// Find the collection in the collections of the authors of the user
			for (let author of this.dataService.adminAuthors) {
				let collection = (await author.GetCollections()).find(c => c.uuid == this.uuid)

				if (collection != null) {
					this.collection = collection
					collectionLoaded = true
				}
			}
		} else if (this.dataService.userAuthor != null) {
			let collection = (await this.dataService.userAuthor.GetCollections()).find(c => c.uuid == this.uuid)

			if (collection != null) {
				this.collection = collection
				collectionLoaded = true
			}
		}

		if (!collectionLoaded) {
			// Redirect back to the author profile
			this.router.navigate(["author"])
			return
		}

		this.collectionName.name = this.collection.name.value
		this.collectionName.language = this.collection.name.language

		let i = 0

		for (let storeBook of await this.collection.GetStoreBooks()) {
			let bookItem: BookListItem = {
				uuid: storeBook.uuid,
				title: storeBook.title,
				coverContent: null,
				coverBlurhash: storeBook.cover?.blurhash
			}

			if (storeBook.cover?.url != null) {
				this.apiService.GetFile({ url: storeBook.cover.url }).then((fileResponse: ApiResponse<string> | ApiErrorResponse) => {
					if (isSuccessStatusCode(fileResponse.status)) {
						bookItem.coverContent = (fileResponse as ApiResponse<string>).data
					}
				})
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

		// Determine the author mode
		if (
			this.dataService.userIsAdmin
			&& (this.dataService.adminAuthors.findIndex(author => author.uuid == this.collection.author) != -1)
		) {
			this.authorMode = AuthorMode.AuthorOfAdmin
		} else if (
			this.dataService.userAuthor
			&& this.collection.author == this.dataService.userAuthor.uuid
		) {
			this.authorMode = AuthorMode.AuthorOfUser
		}

		// Set the links
		this.newBookPageLink.params["collection"] = this.uuid
		if (this.dataService.userIsAdmin) this.newBookPageLink.params["author"] = this.collection.author
		this.backButtonLink = this.dataService.userIsAdmin ? `/author/${this.collection.author}` : "/author"
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