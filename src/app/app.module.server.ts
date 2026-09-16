import { provideLitSsr } from "@dav-apps/ssr-angular"
import { NgModule } from "@angular/core"
import { provideServerRendering, RenderMode, withRoutes } from "@angular/ssr"
import { AppComponent } from "./app.component"
import { AppModule } from "./app.module"

@NgModule({
	imports: [AppModule],
	bootstrap: [AppComponent],
	providers: [
		provideLitSsr(),
		provideServerRendering(withRoutes([{ path: "**", renderMode: RenderMode.Server }]))
	]
})
export class AppServerModule {}
