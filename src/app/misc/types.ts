import { IconDefinition } from "@fortawesome/free-solid-svg-icons"

export interface VisitedBook {
	type: "StoreBook" | "VlbItem"
	slug: string
	title: string
	coverUrl: string
	coverBlurhash: string
	coverAspectRatio: string
}

export interface BookListItem {
	uuid: string
	slug: string
	title: string
	coverContent: string
	coverBlurhash: string
	coverWidth?: number
	coverHeight?: number
	author?: string
}

export interface SeriesListItem {
	uuid: string
	books: BookListItem[]
}

export interface AuthorListItem {
	uuid: string
	slug: string
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

export enum PublisherMode {
	Normal = 0, // If the user is not a publisher and not an admin or an admin but publisher does not belong to admin
	PublisherOfUser = 1, // If the publisher belongs to the user
	PublisherOfAdmin = 2, // If the user is an admin and the publisher belongs to the admin
	VlbPublisher = 3 // If the publisher is a VlbPublisher
}

export enum AuthorMode {
	Normal = 0, // If the user is not an author and not an admin or an admin but author does not belong to admin
	AuthorOfUser = 1, // If the author belongs to the user
	AuthorOfAdmin = 2, // If the user is an admin and the author belongs to the admin
	VlbAuthor = 3 // If the author is a VlbAuthor
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

//#region API types
export interface PublisherResource {
	uuid: string
	slug: string
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
	slug: string
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
	__typename: "StoreBook"
	uuid: string
	collection: StoreBookCollectionResource
	slug: string
	title: string
	description: string
	language: string
	price: number
	printPrice: number
	isbn: string
	luluPrintableId: string
	status: string
	cover: StoreBookCoverResource
	file: StoreBookFileResource
	printCover: StoreBookPrintCoverResource
	printFile: StoreBookPrintFileResource
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
	luluPrintableId: string
	status: string
	cover: StoreBookCoverResource
	file: StoreBookFileResource
	printCover: StoreBookPrintCoverResource
	printFile: StoreBookPrintFileResource
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

export interface CheckoutSessionResource {
	url: string
}

export interface VlbItemResource {
	__typename: "VlbItem"
	uuid: string
	slug: string
	isbn: string
	title: string
	description?: string
	price: number
	language?: string
	publicationDate?: string
	pageCount?: number
	publisher?: VlbPublisherResource
	author?: VlbAuthorResource
	coverUrl?: string
	collections: VlbCollectionResource[]
}

export interface VlbPublisherResource {
	id: string
	name: string
	url: string
}

export interface VlbAuthorResource {
	uuid: string
	slug: string
	isni?: string
	firstName: string
	lastName: string
	bio?: string
}

export interface VlbCollectionResource {
	uuid: string
	slug: string
	title: string
	vlbItems: List<VlbItemResource>
}
//#endregion

//#region dav API types
export interface TableObject {
	uuid: string
}

export interface Order {
	uuid: string
	tableObject: TableObject
	shippingAddress: ShippingAddress
	paymentIntentId: string
	price: number
	currency: Currency
	status: OrderStatus
}

export interface ShippingAddress {
	uuid: string
	name: string
	email: string
	phone: string
	city: string
	country: string
	line1: string
	line2: string
	postalCode: string
	status: string
}

export interface CheckoutSession {
	url: string
}

export type Plan = "FREE" | "PLUS" | "PRO"
export type Currency = "EUR"
export type TableObjectPriceType = "PURCHASE" | "ORDER"
export type OrderStatus = "CREATED" | "PREPARATION" | "SHIPPED"
//#endregion
