import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgxFileHelpersModule } from 'ngx-file-helpers';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavigationPageComponent } from './pages/navigation-page/navigation-page.component';

@NgModule({
   declarations: [
		AppComponent,
		NavigationPageComponent
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
