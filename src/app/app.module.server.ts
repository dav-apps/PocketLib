import { provideLitSsr } from "@dav-apps/ssr-angular"
import { NgModule } from "@angular/core"
import { ServerModule } from "@angular/platform-server"
import { AppComponent } from "./app.component"
import { AppModule } from "./app.module"

@NgModule({
	imports: [AppModule, ServerModule],
	bootstrap: [AppComponent],
	providers: [provideLitSsr()]
})
export class AppServerModule {}
