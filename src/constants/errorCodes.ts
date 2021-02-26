// Generic request errors
export const UnexpectedError = 1000
export const AuthenticationFailed = 1001
export const ActionNotAllowed = 1002
export const ContentTypeNotSupported = 1003

// Errors for missing headers
export const AuthorizationHeaderMissing = 1100
export const ContentTypeHeaderMissing = 1101

// Generic request body errors
export const InvalidBody = 2000

// Missing fields
export const FirstNameMissing = 2100
export const LastNameMissing = 2101
export const NameMissing = 2102
export const BioMissing = 2103
export const LanguageMissing = 2104
export const AuthorMissing = 2105
export const CollectionMissing = 2106
export const TitleMissing = 2107
export const KeyMissing = 2108
export const StoreBookMissing = 2109

// Fields with wrong type
export const FirstNameWrongType = 2200
export const LastNameWrongType = 2201
export const NameWrongType = 2202
export const WebsiteUrlWrongType = 2203
export const FacebookUsernameWrongType = 2204
export const InstagramUsernameWrongType = 2205
export const TwitterUsernameWrongType = 2206
export const BioWrongType = 2207
export const LanguageWrongType = 2208
export const AuthorWrongType = 2209
export const CollectionWrongType = 2210
export const TitleWrongType = 2211
export const DescriptionWrongType = 2212
export const PriceWrongType = 2213
export const IsbnWrongType = 2214
export const StatusWrongType = 2215
export const CategoriesWrongType = 2216
export const PublishedWrongType = 2217
export const KeyWrongType = 2218
export const StoreBookWrongType = 2219

// Too short fields
export const FirstNameTooShort = 2300
export const LastNameTooShort = 2301
export const NameTooShort = 2302
export const BioTooShort = 2303
export const TitleTooShort = 2304
export const DescriptionTooShort = 2305
export const KeyTooShort = 2306

// Too long fields
export const FirstNameTooLong = 2400
export const LastNameTooLong = 2401
export const NameTooLong = 2402
export const BioTooLong = 2403
export const TitleTooLong = 2404
export const DescriptionTooLong = 2405
export const KeyTooLong = 2406

// Invalid fields
export const WebsiteUrlInvalid = 2500
export const FacebookUsernameInvalid = 2501
export const InstagramUsernameInvalid = 2502
export const TwitterUsernameInvalid = 2503
export const PriceInvalid = 2504
export const IsbnInvalid = 2505
export const KeyInvalid = 2506

// Generic state errors
export const UserIsNotAuthor = 3000
export const UserIsAlreadyAuthor = 3001
export const LanguageNotSupported = 3002
export const StoreBookNotPublished = 3003
export const FreeStoreBooksMustBePurchased = 3004
export const StoreBookIsAlreadyInLibrary = 3005
export const StatusNotSupported = 3006
export const NotSufficientStorageAvailable = 3007
export const DavProRequired = 3008

// Access token errors
export const CannotUseOldAccessToken = 3100
export const AccessTokenMustBeRenewed = 3101

// Errors for values already in use
export const KeyAlreadyInUse = 3200

// Errors for publishing StoreBook
export const CannotPublishStoreBookWitoutDescription = 3300
export const CannotPublishStoreBookWithoutCover = 3301
export const CannotPublishStoreBookWithoutFile = 3302

// Errors for updating StoreBook
export const CannotUpdateLanguageOfPublishedStoreBook = 3400
export const CannotUpdatePriceOfPublishedStoreBook = 3401
export const CannotUpdateIsbnOfPublishedStoreBook = 3402
export const CannotUpdateCoverOfPublishedStoreBook = 3403
export const CannotUpdateFileOfPublishedStoreBook = 3404

// Errors for not existing resources
export const UserDoesNotExist = 3500
export const SessionDoesNotExist = 3501
export const PurchaseDoesNotExist = 3502
export const AuthorDoesNotExist = 3503
export const AuthorBioDoesNotExist = 3504
export const AuthorProfileImageDoesNotExist = 3505
export const StoreBookCollectionDoesNotExist = 3506
export const StoreBookCollectionNameDoesNotExist = 3507
export const StoreBookDoesNotExist = 3508
export const StoreBookCoverDoesNotExist = 3509
export const StoreBookFileDoesNotExist = 3510
export const CategoryDoesNotExist = 3511
export const CategoryNameDoesNotExist = 3512