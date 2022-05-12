import { PublisherResource } from "../misc/types"

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

	constructor(
		publisherResource: PublisherResource
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
	}
}