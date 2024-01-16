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
	key: string
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
export interface PublisherResource {
	uuid: string
	name: string
	description: string
	websiteUrl: string
	facebookUsername: string
	instagramUsername: string
	twitterUsername: string
	logo: PublisherLogoResource
	authors: List<AuthorResource>
}

export interface PublisherLogoResource {
	uuid: string
	url: string
	blurhash: string
}

export interface AuthorResource {
	uuid: string
	publisher: PublisherResource
	firstName: string
	lastName: string
	bio: AuthorBioResource
	websiteUrl: string
	facebookUsername: string
	instagramUsername: string
	twitterUsername: string
	profileImage: AuthorProfileImageResource
	bios: List<AuthorBioResource>
	collections: List<StoreBookCollectionResource>
	series: List<StoreBookSeriesResource>
}

export interface AuthorBioResource {
	uuid: string
	bio: string
	language: string
}

export interface AuthorProfileImageResource {
	uuid: string
	url: string
	blurhash: string
}

export interface StoreBookCollectionResource {
	uuid: string
	author: AuthorResource
	name: StoreBookCollectionNameResource
	names: List<StoreBookCollectionNameResource>
	storeBooks: List<StoreBookResource>
}

export interface StoreBookCollectionNameResource {
	uuid: string
	name: string
	language: string
}

export interface StoreBookSeriesResource {
	uuid: string
	author: AuthorResource
	name: string
	language: string
	storeBooks: List<StoreBookResource>
}

export interface StoreBookResource {
	uuid: string
	collection: StoreBookCollectionResource
	title: string
	description: string
	language: string
	price: number
	printPrice: number
	isbn: string
	status: string
	cover: StoreBookCoverResource
	file: StoreBookFileResource
	categories: List<CategoryResource>
	series: List<StoreBookSeriesResource>
	releases: List<StoreBookReleaseResource>
	inLibrary: boolean
	purchased: boolean
}

export interface StoreBookReleaseResource {
	uuid: string
	storeBook: StoreBookResource
	releaseName: string
	releaseNotes: string
	publishedAt: string
	title: string
	description: string
	price: number
	printPrice: number
	isbn: string
	status: string
	cover: StoreBookCoverResource
	file: StoreBookFileResource
	categories: List<CategoryResource>
}

export interface StoreBookCoverResource {
	uuid: string
	url: string
	aspectRatio: string
	blurhash: string
}

export interface StoreBookFileResource {
	uuid: string
	fileName: string
}

export interface StoreBookPrintCoverResource {
	uuid: string
	fileName: string
}

export interface StoreBookPrintFileResource {
	uuid: string
	fileName: string
}

export interface CategoryResource {
	uuid: string
	key: string
	name: CategoryNameResource
	names: List<CategoryNameResource>
}

export interface CategoryNameResource {
	uuid: string
	name: string
	language: string
}

export interface BookResource {
	uuid: string
	storeBook: string
	file: string
}
//#endregion
