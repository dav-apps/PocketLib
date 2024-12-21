import { Environment } from "dav-js"
// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
	environment: Environment.Development,
	apiKey: "gHgHKRbIjdguCM4cv5481hdiF5hZGWZ4x12Ur-7v",
	davApiUrl: "http://localhost:4000",
	pocketlibApiUrl: "http://localhost:4001",
	websiteBaseUrl: "https://dav-website-staging-o3oot.ondigitalocean.app/",
	appId: 6,
	bookTableId: 14,
	bookFileTableId: 15,
	epubBookmarkTableId: 17,
	settingsTableId: 18,
	bookOrderTableId: 30,
	admins: [1]
}

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
