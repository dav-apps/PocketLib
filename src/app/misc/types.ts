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

export interface ListResponseData<T> {
	type: string
	pages: number
	items: T[]
}

//#region API types
//#region Publisher
export interface PublisherResource {
	uuid: string
	name: string
	description: string
	websiteUrl: string
	facebookUsername: string
	instagramUsername: string
	twitterUsername: string
	logo: {
		url: string
		blurhash: string
	}
}

export enum PublisherField {
	uuid = "uuid",
	name = "name",
	description = "description",
	websiteUrl = "website_url",
	facebookUsername = "facebook_username",
	instagramUsername = "instagram_username",
	twitterUsername = "twitter_username",
	logo = "logo",
	logo_url = "logo.url",
	logo_blurhash = "logo.blurhash"
}

export enum PublisherListField {
	type = "type",
	items_uuid = "items.uuid",
	items_name = "items.name",
	items_description = "items.description",
	items_websiteUrl = "items.website_url",
	items_facebookUsername = "items.facebook_username",
	items_instagramUsername = "items.instagram_username",
	items_twitterUsername = "items.twitter_username",
	items_logo = "items.logo",
	items_logo_url = "items.logo.url",
	items_logo_blurhash = "items.logo.blurhash"
}
//#endregion

//#region PublisherLogo
export interface PublisherLogoResource {
	uuid: string
	url: string
	blurhash: string
}

export enum PublisherLogoField {
	uuid = "uuid",
	url = "url",
	blurhash = "blurhash"
}
//#endregion

//#region Author
export interface AuthorResource {
	uuid: string
	publisher: string
	firstName: string
	lastName: string
	bio: {
		value: string
		language: string
	}
	websiteUrl: string
	facebookUsername: string
	instagramUsername: string
	twitterUsername: string
	profileImage: {
		url: string
		blurhash: string
	}
}

export enum AuthorField {
	uuid = "uuid",
	publisher = "publisher",
	firstName = "first_name",
	lastName = "last_name",
	bio = "bio",
	bio_value = "bio.value",
	bio_language = "bio.language",
	websiteUrl = "website_url",
	facebookUsername = "facebook_username",
	instagramUsername = "instagram_username",
	twitterUsername = "twitter_username",
	profileImage = "profile_image",
	profileImage_url = "profile_image.url",
	profileImage_blurhash = "profile_image.blurhash"
}

export enum AuthorListField {
	type = "type",
	pages = "pages",
	items_uuid = "items.uuid",
	items_publisher = "items.publisher",
	items_firstName = "items.first_name",
	items_lastName = "items.last_name",
	items_bio = "items.bio",
	items_bio_value = "items.bio.value",
	items_bio_language = "items.bio.language",
	items_websiteUrl = "items.website_url",
	items_facebookUsername = "items.facebook_username",
	items_instagramUsername = "items.instagram_username",
	items_twitterUsername = "items.twitter_username",
	items_profileImage = "items.profile_image",
	items_profileImage_url = "items.profile_image.url",
	items_profileImage_blurhash = "items.profile_image.blurhash"
}
//#endregion

//#region AuthorBio
export interface AuthorBioResource {
	uuid: string
	bio: string
	language: string
}

export enum AuthorBioField {
	uuid = "uuid",
	bio = "bio",
	language = "language"
}

export enum AuthorBioListField {
	type = "type",
	items_uuid = "items.uuid",
	items_bio = "items.bio",
	items_language = "items.language"
}
//#endregion

//#region AuthorProfileImage
export interface AuthorProfileImageResource {
	uuid: string
	url: string
	blurhash: string
}

export enum AuthorProfileImageField {
	uuid = "uuid",
	url = "url",
	blurhash = "blurhash"
}
//#endregion

//#region StoreBookCollection
export interface StoreBookCollectionResource {
	uuid: string
	author: string
	name: {
		value: string
		language: string
	}
}

export enum StoreBookCollectionField {
	uuid = "uuid",
	author = "author",
	name = "name",
	name_value = "name.value",
	name_language = "name.language"
}

export enum StoreBookCollectionListField {
	type = "type",
	items_uuid = "items.uuid",
	items_author = "items.author",
	items_name = "items.name",
	items_name_value = "items.name.value",
	items_name_language = "items.name.language"
}
//#endregion

//#region StoreBookCollectionName
export interface StoreBookCollectionNameResource {
	uuid: string
	name: string
	language: string
}

export enum StoreBookCollectionNameField {
	uuid = "uuid",
	name = "name",
	language = "language"
}

export enum StoreBookCollectionNameListField {
	type = "type",
	items_uuid = "items.uuid",
	items_name = "items.name",
	items_language = "items.language"
}
//#endregion

//#region StoreBookSeries
export interface StoreBookSeriesResource {
	uuid: string
	author: string
	name: string
	language: string
}

export enum StoreBookSeriesField {
	uuid = "uuid",
	author = "author",
	name = "name",
	language = "language"
}

export enum StoreBookSeriesListField {
	type = "type",
	items_uuid = "items.uuid",
	items_author = "items.author",
	items_name = "items.name",
	items_language = "items.language"
}
//#endregion

//#region StoreBook
export interface StoreBookResource {
	uuid: string
	collection: string
	title: string
	description: string
	language: string
	price: number
	isbn: string
	status: string
	cover: {
		url: string
		aspectRatio: string
		blurhash: string
	}
	file: {
		fileName: string
	}
	inLibrary: boolean
	purchased: boolean
	categories: string[]
}

export enum StoreBookField {
	uuid = "uuid",
	collection = "collection",
	title = "title",
	description = "description",
	language = "language",
	price = "price",
	isbn = "isbn",
	status = "status",
	cover = "cover",
	cover_url = "cover.url",
	cover_aspectRatio = "cover.aspect_ratio",
	cover_blurhash = "cover.blurhash",
	file = "file",
	file_fileName = "file.file_name",
	inLibrary = "in_library",
	purchased = "purchased",
	categories = "categories"
}

export enum StoreBookListField {
	type = "type",
	pages = "pages",
	items_uuid = "items.uuid",
	items_collection = "items.collection",
	items_title = "items.title",
	items_description = "items.description",
	items_language = "items.language",
	items_price = "items.price",
	items_isbn = "items.isbn",
	items_status = "items.status",
	items_cover = "items.cover",
	items_cover_url = "items.cover.url",
	items_cover_aspectRatio = "items.cover.aspect_ratio",
	items_cover_blurhash = "items.cover.blurhash",
	items_file = "items.file",
	items_file_fileName = "items.file.file_name",
	items_inLibrary = "items.in_library",
	items_purchased = "items.purchased",
	items_categories = "items.categories"
}
//#endregion

//#region StoreBookCover
export interface StoreBookCoverResource {
	uuid: string
	url: string
	aspectRatio: string
	blurhash: string
}

export enum StoreBookCoverField {
	uuid = "uuid",
	url = "url",
	aspectRatio = "aspect_ratio",
	blurhash = "blurhash"
}
//#endregion

//#region StoreBookFile
export interface StoreBookFileResource {
	uuid: string
	fileName: string
}

export enum StoreBookFileField {
	uuid = "uuid",
	fileName = "file_name"
}
//#endregion

//#region StoreBookRelease
export interface StoreBookReleaseResource {
	uuid: string
	storeBook: string
	releaseName: string
	releaseNotes: string
	publishedAt: number
	title: string
	description: string
	price: number
	isbn: string
	status: string
	cover: {
		url: string
		aspectRatio: string
		blurhash: string
	}
	file: {
		fileName: string
	}
	categories: string[]
}

export enum StoreBookReleaseField {
	uuid = "uuid",
	storeBook = "store_book",
	releaseName = "release_name",
	releaseNotes = "release_notes",
	publishedAt = "published_at",
	title = "title",
	description = "description",
	price = "price",
	isbn = "isbn",
	status = "status",
	cover = "cover",
	cover_url = "cover.url",
	cover_aspectRatio = "cover.aspect_ratio",
	cover_blurhash = "cover.blurhash",
	file = "file",
	file_fileName = "file.file_name",
	categories = "categories"
}

export enum StoreBookReleaseListField {
	type = "type",
	items_uuid = "items.uuid",
	items_storeBook = "items.store_book",
	items_releaseName = "items.release_name",
	items_releaseNotes = "items.release_notes",
	items_publishedAt = "items.published_at",
	items_title = "items.title",
	items_description = "items.description",
	items_price = "items.price",
	items_isbn = "items.isbn",
	items_status = "items.status",
	items_cover = "items.cover",
	items_cover_url = "items.cover.url",
	items_cover_aspectRatio = "items.cover.aspect_ratio",
	items_cover_blurhash = "items.cover.blurhash",
	items_file = "items.file",
	items_file_fileName = "items.file.file_name",
	items_categories = "items.categories"
}
//#endregion

//#region Category
export interface CategoryResource {
	uuid: string
	key: string
	name: {
		value: string
		language: string
	}
}

export enum CategoryField {
	uuid = "uuid",
	key = "key",
	name = "name",
	name_value = "name.value",
	name_language = "name.language"
}

export enum CategoryListField {
	type = "type",
	items_uuid = "items.uuid",
	items_key = "items.key",
	items_name = "items.name",
	items_name_value = "items.name.value",
	items_name_language = "items.name.language"
}
//#endregion

//#region Book
export interface BookResource {
	uuid: string
	storeBook: string
	file: string
}

export enum BookField {
	uuid = "uuid",
	storeBook = "store_book",
	file = "file"
}
//#endregion
//#endregion
