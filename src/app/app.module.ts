import { NgModule } from '@angular/core'
import { environment } from '../environments/environment'

// Modules
import { AngularReactBrowserModule } from '@angular-react/core'
import { AppRoutingModule } from './app-routing.module'
import { NgxFileHelpersModule } from 'ngx-file-helpers'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { MatToolbarModule } from '@angular/material'
import { MatButtonModule } from '@angular/material/button'
import { MatRadioModule } from '@angular/material/radio'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatTreeModule } from '@angular/material/tree'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatListModule } from '@angular/material/list'
import { PortalModule } from '@angular/cdk/portal'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { PdfViewerModule } from 'ng2-pdf-viewer'
import { 
   FabTextFieldModule, 
   FabButtonModule,
   FabMessageBarModule,
   FabIconModule,
   FabPanelModule,
   FabCalloutModule,
   FabSliderModule,
	FabToggleModule,
	FabSpinnerModule,
	FabDialogModule,
	FabDropdownModule,
	FabCheckboxModule
} from '@angular-react/fabric'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { ServiceWorkerModule } from '@angular/service-worker'

// Services
import { DataService } from './services/data-service'
import { ApiService } from './services/api-service'
import { RoutingService } from './services/routing-service'

// Components
import { AppComponent } from './app.component'
import { ChaptersTreeComponent } from './components/chapters-tree/chapters-tree.component'
import { EditCollectionNamesComponent } from './components/edit-collection-names/edit-collection-names.component'
import { EpubContentComponent } from './components/epub-content/epub-content.component'
import { PdfContentComponent } from './components/pdf-content/pdf-content.component'
import { AuthorProfileComponent } from './components/author-profile/author-profile.component'
import { CollectionViewComponent } from './components/collection-view/collection-view.component'
import { HorizontalBookListComponent } from './components/horizontal-book-list/horizontal-book-list.component'
import { HorizontalAuthorListComponent } from './components/horizontal-author-list/horizontal-author-list.component'
import { LanguageDropdownComponent } from './components/language-dropdown/language-dropdown.component'
import { CategoriesSelectionComponent } from './components/categories-selection/categories-selection.component'
import { EditPriceComponent } from './components/edit-price/edit-price.component'
import { AddListItemComponent } from './components/add-list-item/add-list-item.component'
import { HeaderComponent } from './components/header/header.component'
import { LinkIconButtonComponent } from './components/link-icon-button/link-icon-button.component'
import { BlurhashImageComponent } from './components/blurhash-image/blurhash-image.component'
import { LanguagesSelectionComponent } from './components/languages-selection/languages-selection.component'

// Pages
import { LibraryPageComponent } from './pages/library-page/library-page.component'
import { BookPageComponent } from './pages/book-page/book-page.component'
import { AccountPageComponent } from './pages/account-page/account-page.component'
import { SettingsPageComponent } from './pages/settings-page/settings-page.component'
import { AuthorPageComponent } from './pages/author-page/author-page.component'
import { AuthorSetupPageComponent } from './pages/author-setup-page/author-setup-page.component'
import { AuthorCollectionPageComponent } from './pages/author-collection-page/author-collection-page.component'
import { AuthorBookPageComponent } from './pages/author-book-page/author-book-page.component'
import { NewBookPageComponent } from './pages/new-book-page/new-book-page.component'
import { LoadingPageComponent } from './pages/loading-page/loading-page.component'
import { StorePageComponent } from './pages/store-page/store-page.component'
import { StoreStartPageComponent } from './pages/store-start-page/store-start-page.component'
import { StoreAuthorPageComponent } from './pages/store-author-page/store-author-page.component'
import { StoreBookPageComponent } from './pages/store-book-page/store-book-page.component'
import { StoreBooksPageComponent } from './pages/store-books-page/store-books-page.component'

@NgModule({
   declarations: [
		// Components
		AppComponent,
		ChaptersTreeComponent,
		EditCollectionNamesComponent,
		EpubContentComponent,
		PdfContentComponent,
		AuthorProfileComponent,
		CollectionViewComponent,
		HorizontalBookListComponent,
		HorizontalAuthorListComponent,
		LanguageDropdownComponent,
		CategoriesSelectionComponent,
		EditPriceComponent,
		AddListItemComponent,
		HeaderComponent,
		LinkIconButtonComponent,
		BlurhashImageComponent,
		LanguagesSelectionComponent,
		// Pages
      LibraryPageComponent,
      BookPageComponent,
      AccountPageComponent,
      SettingsPageComponent,
		AuthorPageComponent,
		AuthorSetupPageComponent,
		AuthorCollectionPageComponent,
		AuthorBookPageComponent,
		NewBookPageComponent,
		LoadingPageComponent,
		StorePageComponent,
		StoreStartPageComponent,
		StoreAuthorPageComponent,
		StoreBookPageComponent,
		StoreBooksPageComponent
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
		MatProgressSpinnerModule,
		MatSidenavModule,
		MatSnackBarModule,
		MatListModule,
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
		FabToggleModule,
		FabSpinnerModule,
		FabDialogModule,
		FabDropdownModule,
		FabCheckboxModule,
		FontAwesomeModule,
      ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  	],
  	providers: [
		DataService,
		ApiService,
		RoutingService
   ],
   bootstrap: [AppComponent],
   entryComponents: [
      EpubContentComponent,
      PdfContentComponent
   ]
})
export class AppModule { }
