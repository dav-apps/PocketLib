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