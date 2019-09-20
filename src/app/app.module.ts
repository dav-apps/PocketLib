import { NgModule } from '@angular/core';
import { AngularReactBrowserModule } from '@angular-react/core';
import { NgxFileHelpersModule } from 'ngx-file-helpers';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTreeModule } from '@angular/material/tree';
import { PortalModule } from '@angular/cdk/portal';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { 
   FabTextFieldModule, 
   FabButtonModule, 
   FabMessageBarModule,
   FabIconModule,
   FabPanelModule,
   FabCalloutModule,
   FabSliderModule
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
import { LoadingPageComponent } from './pages/loading-page/loading-page.component';
import { EpubContentComponent } from './components/epub-content/epub-content.component';
import { PdfContentComponent } from './components/pdf-content/pdf-content.component';
import { ChaptersTreeComponent } from './components/chapters-tree/chapters-tree.component';
import { RenameBookModalComponent } from './components/rename-book-modal/rename-book-modal.component';
import { DeleteBookModalComponent } from './components/delete-book-modal/delete-book-modal.component';
import { LogoutModalComponent } from './components/logout-modal/logout-modal.component';
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
      LoadingPageComponent,
      EpubContentComponent,
      PdfContentComponent,
      ChaptersTreeComponent,
      RenameBookModalComponent,
      DeleteBookModalComponent,
		LogoutModalComponent
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
      MatTreeModule,
      PortalModule,
		NgbModule,
		PdfViewerModule,
      FabTextFieldModule,
      FabButtonModule,
      FabMessageBarModule,
      FabIconModule,
      FabPanelModule,
      FabCalloutModule,
      FabSliderModule,
      ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  	],
  	providers: [
      DataService
   ],
   bootstrap: [AppComponent],
   entryComponents: [
      EpubContentComponent,
      PdfContentComponent
   ]
})
export class AppModule { }
