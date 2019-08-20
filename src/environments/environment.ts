// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
   production: false,
   apiKey: "eUzs3PQZYweXvumcWvagRHjdUroGe5Mo7kN1inHm",
   baseUrl: "http://localhost:3001",
   version: "0.2",
   appId: 6,
   bookTableId: 14,
   bookFileTableId: 15,
   appTableId: 16,
   // Keys for Book table properties
   bookTableFileUuidKey: "file_uuid",
   bookTableChapterKey: "chapter",
   bookTableProgressKey: "progress",
   // Keys for App table properties
   appTableNameKey: "name",
   appTableUrlKey: "url",
   // Settings keys
   settingsThemeKey: "settings-theme",
   // Settings default
   settingsThemeDefault: "system",
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
