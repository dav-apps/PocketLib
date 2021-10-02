import { enableProdMode } from '@angular/core'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'

import { AppModule } from './app/app.module'
import { environment } from './environments/environment'

import {
	provideFluentDesignSystem,
	fluentButton,
	fluentTextField,
	fluentTextArea,
	fluentProgressRing
} from '@fluentui/web-components'

provideFluentDesignSystem()
	.register(
		fluentButton(),
		fluentTextField(),
		fluentTextArea(),
		fluentProgressRing()
	)

if (environment.production) {
	enableProdMode()
}

platformBrowserDynamic().bootstrapModule(AppModule)
	.catch(err => console.error(err))
