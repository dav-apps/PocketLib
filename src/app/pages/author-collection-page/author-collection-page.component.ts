import { Component } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { ApiErrorResponse, ApiResponse, isSuccessStatusCode } from 'dav-js'
import { DataService, FindAppropriateLanguage } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { GetDualScreenSettings } from 'src/app/misc/utils'
import { BookListItem, AuthorMode, StoreBookCollectionResource, StoreBookCollectionField, ListResponseData, StoreBookResource, StoreBookListField } from 'src/app/misc/types'
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
	collection: {
		uuid: string,
		author: string,
		names: { name: string, language: string }[],
		books: BookListItem[],
		leftScreenBooks: BookListItem[],
		rightScreenBooks: BookListItem[]
	} = { uuid: "", author: "", names: [], books: [], leftScreenBooks: [], rightScreenBooks: [] }
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

		// Get the collection
		let retrieveCollectionResponse = await this.apiService.RetrieveStoreBookCollection({
			uuid: this.uuid,
			fields: [
				StoreBookCollectionField.uuid,
				StoreBookCollectionField.author,
				StoreBookCollectionField.name
			],
			languages: await this.dataService.GetStoreLanguages()
		})

		if (isSuccessStatusCode(retrieveCollectionResponse.status)) {
			let retrieveCollectionResponseData = (retrieveCollectionResponse as ApiResponse<StoreBookCollectionResource>).data

			this.collection = {
				uuid: retrieveCollectionResponseData.uuid,
				author: retrieveCollectionResponseData.author,
				names: [],
				books: [],
				leftScreenBooks: [],
				rightScreenBooks: []
			}

			this.collectionName.name = retrieveCollectionResponseData.name.value
			this.collectionName.language = retrieveCollectionResponseData.name.language

			// Get the store books of the collection
			let listStoreBooksResponse = await this.apiService.ListStoreBooks({
				collection: this.collection.uuid,
				fields: [
					StoreBookListField.items_uuid,
					StoreBookListField.items_title,
					StoreBookListField.items_cover
				],
				languages: await this.dataService.GetStoreLanguages()
			})

			if (isSuccessStatusCode(listStoreBooksResponse.status)) {
				let listStoreBooksResponseData = (listStoreBooksResponse as ApiResponse<ListResponseData<StoreBookResource>>).data
				let i = 0

				for (let storeBook of listStoreBooksResponseData.items) {
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
							this.collection.leftScreenBooks.push(bookItem)
						} else {
							this.collection.rightScreenBooks.push(bookItem)
						}

						i++
					} else {
						this.collection.books.push(bookItem)
					}
				}
			}
		} else {
			// Redirect back to the author page
			this.router.navigate(["author"])
			return
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

	ShowNamesDialog() {
		// Update the collection names for the EditNames component
		this.collectionNames = []
		let languages = this.dataService.GetLocale().misc.languages

		for (let collectionName of this.collection.names) {
			this.collectionNames.push({
				name: collectionName.name,
				language: collectionName.language,
				fullLanguage: collectionName.language == "de" ? languages.de : languages.en,
				edit: false
			})
		}

		this.namesDialogVisible = true
	}

	UpdateCollectionName(collectionName: { name: string, language: string }) {
		if (this.collectionName.language == collectionName.language) {
			// Update the title
			this.collectionName.name = collectionName.name
		} else {
			let i = this.collection.names.findIndex(name => name.language == collectionName.language)

			if (i == -1) {
				// Add the name to the collection
				this.collection.names.push(collectionName)

				// Update the title if the name for the current language was added
				let j = FindAppropriateLanguage(this.dataService.supportedLocale, this.collection.names)
				if (j != -1) this.collectionName = this.collection.names[j]
			} else {
				// Update the name in the collection
				this.collection.names[i].name = collectionName.name
			}
		}
	}
}