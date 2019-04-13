import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgxFileHelpersModule } from 'ngx-file-helpers';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavigationPageComponent } from './pages/navigation-page/navigation-page.component';
import { LibraryPageComponent } from './pages/library-page/library-page.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';

@NgModule({
   declarations: [
		AppComponent,
      NavigationPageComponent,
      LibraryPageComponent,
      SettingsPageComponent
  	],
  	imports: [
   	BrowserModule,
      AppRoutingModule,
      NgxFileHelpersModule
  	],
  	providers: [],
  	bootstrap: [AppComponent]
})
export class AppModule { }
