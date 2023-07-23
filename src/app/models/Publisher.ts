import { PromiseHolder } from "dav-js"
import { Language, PublisherResource2 } from "../misc/types"
import { GraphQLService } from "src/app/services/graphql-service"
import { Author } from "./Author"

export class Publisher {
	public uuid: string
	public name: string
	public description: string
	public websiteUrl: string
	public facebookUsername: string
	public instagramUsername: string
	public twitterUsername: string
	public logo: {
		url: string
		blurhash: string
	}
	private authors: {
		page: number
		pages: number
		limit: number
		loaded: boolean
		isLoading: boolean
		itemsPromiseHolder: PromiseHolder<Author[]>
	}[]

	constructor(
		publisherResource: PublisherResource2,
		private languages: Language[],
		private graphqlService: GraphQLService
	) {
		this.uuid = publisherResource?.uuid ?? ""
		this.name = publisherResource?.name ?? ""
		this.description = publisherResource?.description ?? ""
		this.websiteUrl = publisherResource?.websiteUrl ?? ""
		this.facebookUsername = publisherResource?.facebookUsername ?? ""
		this.instagramUsername = publisherResource?.instagramUsername ?? ""
		this.twitterUsername = publisherResource?.twitterUsername ?? ""
		this.logo = {
			url: publisherResource?.logo?.url,
			blurhash: publisherResource?.logo?.blurhash
		}
		this.authors = []
	}

	async ReloadLogo() {
		let response = await this.graphqlService.retrievePublisher(
			`
				logo {
					url
				}
			`,
			{
				uuid: this.uuid
			}
		)
		let responseData = response.data.retrievePublisher
		this.logo.url = responseData.logo?.url
		this.logo.blurhash = responseData.logo?.blurhash
	}

	async GetAuthors(page: number = -1, limit: number = 50): Promise<Author[]> {
		if (limit <= 0) limit = 50
		let authorItem = this.authors.find(
			item => item.page == page && item.limit == limit
		)

		if (authorItem != null && (authorItem.isLoading || authorItem.loaded)) {
			let items = []

			for (let item of await authorItem.itemsPromiseHolder.AwaitResult()) {
				items.push(item)
			}

			return items
		}

		authorItem = {
			page,
			pages: 1,
			limit,
			loaded: false,
			isLoading: true,
			itemsPromiseHolder: new PromiseHolder<Author[]>()
		}
		this.authors.push(authorItem)
		let items = []

		if (page == -1) {
			// Get all authors of the publisher
			let authorPage = 0

			while (authorItem.pages > authorPage) {
				authorPage++

				let response = await this.graphqlService.listAuthors(
					`
						total
						items {
							uuid
							publisher {
								uuid
							}
							firstName
							lastName
							bio {
								bio
								language
							}
							websiteUrl
							facebookUsername
							instagramUsername
							twitterUsername
							profileImage {
								url
								blurhash
							}
						}
					`,
					{
						languages: this.languages,
						limit,
						offset: authorPage * limit
					}
				)
				let responseData = response.data.listAuthors

				if (responseData != null) {
					for (let item of responseData.items) {
						items.push(
							new Author(item, this.languages, this.graphqlService)
						)
					}
				} else {
					authorItem.isLoading = false
					authorItem.itemsPromiseHolder.Resolve([])
					return null
				}
			}
		} else {
			let response = await this.graphqlService.listAuthors(
				`
					total
					items {
						uuid
						publisher {
							uuid
						}
						firstName
						lastName
						bio {
							uuid
							bio
							language
						}
						websiteUrl
						facebookUsername
						instagramUsername
						twitterUsername
						profileImage {
							url
							blurhash
						}
					}
				`,
				{
					languages: this.languages,
					limit,
					offset: page * limit
				}
			)
			let responseData = response.data.listAuthors

			if (responseData != null) {
				authorItem.pages = responseData.total / limit

				for (let item of responseData.items) {
					items.push(new Author(item, this.languages, this.graphqlService))
				}
			} else {
				authorItem.isLoading = false
				authorItem.itemsPromiseHolder.Resolve([])
				return null
			}
		}

		authorItem.loaded = true
		authorItem.isLoading = false
		authorItem.itemsPromiseHolder.Resolve(items)
		return items
	}

	GetAuthorPages(page: number = -1, limit: number = 50) {
		let authorItem = this.authors.find(
			item => item.page == page && item.limit == limit
		)

		if (authorItem != null) {
			return authorItem.pages
		} else {
			return 1
		}
	}

	ClearAuthors() {
		this.authors = []
	}
}
