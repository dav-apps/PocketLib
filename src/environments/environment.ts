// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
   production: false,
   apiKey: "eUzs3PQZYweXvumcWvagRHjdUroGe5Mo7kN1inHm",
   baseUrl: "http://localhost:3001",
   version: "0.4",
   appId: 6,
	bookTableId: 14,
   bookFileTableId: 15,
   appTableId: 16,
   epubBookmarkTableId: 17,
   settingsTableId: 18,
	// Shared keys for book table
	bookTableFileUuidKey: "file_uuid",
   // Keys for EpubBook
	epubBookTableChapterKey: "chapter",
   epubBookTableProgressKey: "progress",
   epubBookTableBookmarksKey: "bookmarks",
	// Keys for PdfBook
	pdfBookTableTitleKey: "title",
   pdfBookTablePageKey: "page",
   pdfBookTableBookmarksKey: "bookmarks",
   pdfBookTableZoomKey: "zoom",
   // Keys for App table
   appTableNameKey: "name",
   appTableUrlKey: "url",
   // Keys for EpubBookmark table
   epubBookmarkTableBookKey: "book",
   epubBookmarkTableNameKey: "name",
   epubBookmarkTableChapterKey: "chapter",
   epubBookmarkTableProgressKey: "progress",
   // Keys for Settings table
   settingsTableCurrentBookKey: "current_book",
   // Settings keys
   settingsThemeKey: "settings-theme",
   settingsOpenLastReadBookKey: "settings-openLastReadBook",
   // Settings default
   settingsThemeDefault: "system",
   settingsOpenLastReadBookDefault: true,
   // Other keys
   themeKey: "theme",
   lightThemeKey: "light",
	darkThemeKey: "dark",
	systemThemeKey: "system"
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
