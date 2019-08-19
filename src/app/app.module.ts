import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxFileHelpersModule } from 'ngx-file-helpers';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { PortalModule } from '@angular/cdk/portal';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { DataService } from './services/data-service';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LibraryPageComponent } from './pages/library-page/library-page.component';
import { BookPageComponent } from './pages/book-page/book-page.component';
import { AccountPageComponent } from './pages/account-page/account-page.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';
import { DeveloperPageComponent } from './pages/developer-page/developer-page.component';
import { AppsPageComponent } from './pages/apps-page/apps-page.component';
import { NewAppPageComponent } from './pages/new-app-page/new-app-page.component';
import { AuthorPageComponent } from './pages/author-page/author-page.component';
import { BookContentComponent } from './components/book-content/book-content.component';
import { LogoutModalComponent } from './components/logout-modal/logout-modal.component';
import { DeleteBookModalComponent } from './components/delete-book-modal/delete-book-modal.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

@NgModule({
   declarations: [
		AppComponent,
      LibraryPageComponent,
      BookPageComponent,
      AccountPageComponent,
      SettingsPageComponent,
      DeveloperPageComponent,
      AppsPageComponent,
      NewAppPageComponent,
      AuthorPageComponent,
      BookContentComponent,
      LogoutModalComponent,
      DeleteBookModalComponent
  	],
  	imports: [
   	BrowserModule,
      AppRoutingModule,
      NgxFileHelpersModule,
      BrowserAnimationsModule,
      MatToolbarModule,
      MatButtonModule,
      MatRadioModule,
      PortalModule,
      NgbModule,
      ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  	],
  	providers: [
      DataService
   ],
   bootstrap: [AppComponent],
   entryComponents: [
      BookContentComponent
   ]
})
export class AppModule { }
