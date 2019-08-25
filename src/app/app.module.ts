import { NgModule } from '@angular/core';
import { AngularReactBrowserModule } from '@angular-react/core';
import { NgxFileHelpersModule } from 'ngx-file-helpers';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PortalModule } from '@angular/cdk/portal';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { 
   FabTextFieldModule, 
   FabButtonModule, 
   FabMessageBarModule,
   FabIconModule 
} from '@angular-react/fabric';

import { DataService } from './services/data-service';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LibraryPageComponent } from './pages/library-page/library-page.component';
import { BookPageComponent } from './pages/book-page/book-page.component';
import { AccountPageComponent } from './pages/account-page/account-page.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';
import { DeveloperPageComponent } from './pages/developer-page/developer-page.component';
import { AppPageComponent } from './pages/app-page/app-page.component';
import { NewAppPageComponent } from './pages/new-app-page/new-app-page.component';
import { AuthorPageComponent } from './pages/author-page/author-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
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
      AppPageComponent,
      NewAppPageComponent,
      AuthorPageComponent,
      LoginPageComponent,
      BookContentComponent,
      LogoutModalComponent,
      DeleteBookModalComponent
  	],
  	imports: [
   	AngularReactBrowserModule,
      AppRoutingModule,
      NgxFileHelpersModule,
      BrowserAnimationsModule,
      MatToolbarModule,
      MatButtonModule,
      MatRadioModule,
      MatInputModule,
      MatFormFieldModule,
      PortalModule,
		NgbModule,
      FabTextFieldModule,
      FabButtonModule,
      FabMessageBarModule,
      FabIconModule,
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
