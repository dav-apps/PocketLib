import { IconDefinition } from "@fortawesome/free-solid-svg-icons"

export interface BookListItem {
	uuid: string
	title: string
	coverContent: string
	coverBlurhash: string
	coverWidth?: number
	coverHeight?: number
}

export interface SeriesListItem {
	uuid: string
	books: BookListItem[]
}

export interface AuthorListItem {
	uuid: string
	firstName: string
	lastName: string
	profileImageContent: string
	profileImageBlurhash: string
	profileImageAlt: string
}

export interface StoreBookItem {
	uuid: string
	title: string
	description: string
	language: string
	status: StoreBookStatus
	coverContent: string
	coverBlurhash: string
}

export interface Category {
	key: string
	name: string
	language: string
}

export interface CategoryCard {
	icon: IconDefinition
	text: string
}

export interface Route {
	url: string
	fullUrl?: string
	params: { [key: string]: any }
}

export enum PublisherMode {
	Normal = 0, // If the user is not a publisher and not an admin or an admin but publisher does not belong to admin
	PublisherOfUser = 1, // If the publisher belongs to the user
	PublisherOfAdmin = 2 // If the user is an admin and the publisher belongs to the admin
}

export enum AuthorMode {
	Normal = 0, // If the user is not an author and not an admin or an admin but author does not belong to admin
	AuthorOfUser = 1, // If the author belongs to the user
	AuthorOfAdmin = 2 // If the user is an admin and the author belongs to the admin
}

export enum StoreBookStatus {
	Unpublished = 0,
	Review = 1,
	Published = 2,
	Hidden = 3
}

export enum StoreBookReleaseStatus {
	Unpublished = 0,
	Published = 1
}

export enum Language {
	en = "en",
	de = "de"
}

export enum StoreBooksPageContext {
	AllBooks,
	Category
}

export interface List<T> {
	total: number
	items: T[]
}

export interface ApiResponse<T> {
	status: number
	data?: T
	error?: {
		code: string
		message: string
	}
}

//#region API interfaces
export interface PublisherResource2 {
	uuid: string
	name: string
	description: string
	websiteUrl: string
	facebookUsername: string
	instagramUsername: string
	twitterUsername: string
	logo: PublisherLogoResource2
	authors: List<AuthorResource2>
}

export interface PublisherLogoResource2 {
	uuid: string
	url: string
	blurhash: string
}

export interface AuthorResource2 {
	uuid: string
	publisher: PublisherResource2
	firstName: string
	lastName: string
	bio: AuthorBioResource2
	websiteUrl: string
	facebookUsername: string
	instagramUsername: string
	twitterUsername: string
	profileImage: AuthorProfileImageResource2
	bios: List<AuthorBioResource2>
	collections: List<StoreBookCollectionResource2>
	series: List<StoreBookSeriesResource2>
}

export interface AuthorBioResource2 {
	uuid: string
	bio: string
	language: string
}

export interface AuthorProfileImageResource2 {
	uuid: string
	url: string
	blurhash: string
}

export interface StoreBookCollectionResource2 {
	uuid: string
	author: AuthorResource2
	name: StoreBookCollectionNameResource2
	names: List<StoreBookCollectionNameResource2>
	storeBooks: List<StoreBookResource2>
}

export interface StoreBookCollectionNameResource2 {
	uuid: string
	name: string
	language: string
}

export interface StoreBookSeriesResource2 {
	uuid: string
	author: AuthorResource2
	name: string
	language: string
	storeBooks: List<StoreBookResource2>
}

export interface StoreBookResource2 {
	uuid: string
	collection: StoreBookCollectionResource2
	title: string
	description: string
	language: string
	price: number
	isbn: string
	status: string
	cover: StoreBookCoverResource2
	file: StoreBookFileResource2
	categories: List<CategoryResource2>
	series: List<StoreBookSeriesResource2>
	releases: List<StoreBookReleaseResource2>
	inLibrary: boolean
	purchased: boolean
}

export interface StoreBookReleaseResource2 {
	uuid: string
	storeBook: StoreBookResource2
	releaseName: string
	releaseNotes: string
	publishedAt: string
	title: string
	description: string
	price: number
	isbn: string
	status: string
	cover: StoreBookCoverResource2
	file: StoreBookFileResource2
	categories: List<CategoryResource2>
}

export interface StoreBookCoverResource2 {
	uuid: string
	url: string
	aspectRatio: string
	blurhash: string
}

export interface StoreBookFileResource2 {
	uuid: string
	fileName: string
}

export interface CategoryResource2 {
	uuid: string
	key: string
	name: CategoryNameResource2
	names: List<CategoryNameResource2>
}

export interface CategoryNameResource2 {
	uuid: string
	name: string
	language: string
}

export interface BookResource2 {
	uuid: string
	storeBook: string
	file: string
}
//#endregion
