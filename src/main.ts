import "@dav-apps/ssr-angular/enable-lit-ssr.js"
import { enableProdMode, provideZoneChangeDetection } from '@angular/core'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import { Environment } from "dav-js"

import { AppModule } from './app/app.module'
import { environment } from './environments/environment'

if (
	environment.environment == Environment.Staging ||
	environment.environment == Environment.Production
) {
	enableProdMode()
}

platformBrowserDynamic()
	.bootstrapModule(AppModule, {
		applicationProviders: [provideZoneChangeDetection()]
	})
	.catch(err => console.error(err))
