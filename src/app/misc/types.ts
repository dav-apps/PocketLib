export interface BookListItem {
	uuid: string
	title: string
	cover: boolean
	coverContent: string
	coverBlurhash: string
	coverWidth?: number
	coverHeight?: number
}

export interface AuthorListItem {
	uuid: string
	firstName: string
	lastName: string
	profileImage: boolean
	profileImageContent: string
	profileImageBlurhash: string
	profileImageAlt: string
}

export interface Author {
	uuid: string
	firstName: string
	lastName: string
	websiteUrl: string
	facebookUsername: string
	instagramUsername: string
	twitterUsername: string
	bios: {
		bio: string,
		language: string
	}[]
	collections: {
		uuid: string,
		names: {
			name: string,
			language: string
		}[],
		books: {
			uuid: string,
			title: string,
			description: string,
			language: string,
			status: BookStatus,
			cover: boolean,
			coverContent: string,
			coverBlurhash: string,
			file: boolean
		}[]
	}[]
	profileImage: boolean
	profileImageBlurhash: string
}

export interface Category {
	key: string
	name: string
	language: string
}

export interface Route {
	url: string,
	fullUrl?: string,
	params: { [key: string]: any }
}

export enum AuthorMode {
	Normal = 0,			// If the user is not an author and not an admin or an admin but author does not belong to admin
	AuthorOfUser = 1,	// If the author belongs to the user
	AuthorOfAdmin = 2	// If the user is an admin and the author belongs to the admin
}

export enum BookStatus {
	Unpublished = 0,
	Review = 1,
	Published = 2,
	Hidden = 3
}