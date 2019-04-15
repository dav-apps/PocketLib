import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgxFileHelpersModule } from 'ngx-file-helpers';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DataService } from './services/data-service';
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
      NgxFileHelpersModule,
      BrowserAnimationsModule
  	],
  	providers: [
      DataService
   ],
  	bootstrap: [AppComponent]
})
export class AppModule { }
