import { PublisherResource } from "../misc/types"

export class Publisher {
	public uuid: string
	public name: string
	public description: string
	public websiteUrl: string
	public facebookUsername: string
	public instagramUsername: string
	public twitterUsername: string
	public profileImage: {
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
		this.profileImage = {
			url: publisherResource?.profileImage?.url,
			blurhash: publisherResource?.profileImage?.blurhash
		}
	}
}