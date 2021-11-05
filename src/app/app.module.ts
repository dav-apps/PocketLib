import { BrowserModule } from '@angular/platform-browser'
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { environment } from '../environments/environment'

// Modules
import { AppRoutingModule } from './app-routing.module'
import { NgxFileHelpersModule } from 'ngx-file-helpers'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { MatToolbarModule } from '@angular/material/toolbar'
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
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { ServiceWorkerModule } from '@angular/service-worker'

// Services
import { DataService } from './services/data-service'
import { ApiService } from './services/api-service'
import { CachingService } from './services/caching-service'
import { RoutingService } from './services/routing-service'

// Components
import { AppComponent } from './app.component'
import { ChaptersTreeComponent } from './components/chapters-tree/chapters-tree.component'
import { EditNamesComponent } from './components/edit-names/edit-names.component'
import { EpubViewerComponent } from './components/epub-viewer/epub-viewer.component'
import { PdfViewerComponent } from './components/pdf-viewer/pdf-viewer.component'
import { AuthorProfileComponent } from './components/author-profile/author-profile.component'
import { HorizontalBookListComponent } from './components/horizontal-book-list/horizontal-book-list.component'
import { HorizontalAuthorListComponent } from './components/horizontal-author-list/horizontal-author-list.component'
import { HorizontalAuthorListItemComponent } from './components/horizontal-author-list-item/horizontal-author-list-item.component'
import { StoreBookCardComponent } from './components/store-book-card/store-book-card.component'
import { LanguageDropdownComponent } from './components/language-dropdown/language-dropdown.component'
import { CategoriesSelectionComponent } from './components/categories-selection/categories-selection.component'
import { PriceInputComponent } from './components/price-input/price-input.component'
import { IsbnInputComponent } from './components/isbn-input/isbn-input.component'
import { AddListItemComponent } from './components/add-list-item/add-list-item.component'
import { HeaderComponent } from './components/header/header.component'
import { LinkIconButtonComponent } from './components/link-icon-button/link-icon-button.component'
import { BlurhashImageComponent } from './components/blurhash-image/blurhash-image.component'
import { LanguagesSelectionComponent } from './components/languages-selection/languages-selection.component'
import { UserProfileComponent } from './components/user-profile/user-profile.component'
import { DavProCardComponent } from './components/dav-pro-card/dav-pro-card.component'
import { HorizontalBookCardComponent } from './components/horizontal-book-card/horizontal-book-card.component'
import { HorizontalBooksCardComponent } from './components/horizontal-books-card/horizontal-books-card.component'
import { LibraryPageCardsComponent } from './components/library-page-cards/library-page-cards.component'
import { LibraryPageBookCardComponent } from './components/library-page-book-card/library-page-book-card.component'
import { NewBookPageTitleSectionComponent } from './components/new-book-page-title-section/new-book-page-title-section.component'
import { NewBookPageCollectionSectionComponent } from './components/new-book-page-collection-section/new-book-page-collection-section.component'
import { NewBookPageDescriptionSectionComponent } from './components/new-book-page-description-section/new-book-page-description-section.component'
import { NewBookPageCategoriesSectionComponent } from './components/new-book-page-categories-section/new-book-page-categories-section.component'
import { NewBookPagePriceSectionComponent } from './components/new-book-page-price-section/new-book-page-price-section.component'
import { NewBookPageIsbnSectionComponent } from './components/new-book-page-isbn-section/new-book-page-isbn-section.component'
import { NewBookPageCoverSectionComponent } from './components/new-book-page-cover-section/new-book-page-cover-section.component'
import { NewBookPageBookFileSectionComponent } from './components/new-book-page-book-file-section/new-book-page-book-file-section.component'
import { NewSeriesPageNameSectionComponent } from './components/new-series-page-name-section/new-series-page-name-section.component'
import { NewSeriesPageBookSelectionSectionComponent } from './components/new-series-page-book-selection-section/new-series-page-book-selection-section.component'

// Pages
import { LibraryPageComponent } from './pages/library-page/library-page.component'
import { BookPageComponent } from './pages/book-page/book-page.component'
import { AccountPageComponent } from './pages/account-page/account-page.component'
import { SettingsPageComponent } from './pages/settings-page/settings-page.component'
import { AuthorPageComponent } from './pages/author-page/author-page.component'
import { AuthorSetupPageComponent } from './pages/author-setup-page/author-setup-page.component'
import { AuthorCollectionPageComponent } from './pages/author-collection-page/author-collection-page.component'
import { AuthorSeriesPageComponent } from './pages/author-series-page/author-series-page.component'
import { AuthorBookPageComponent } from './pages/author-book-page/author-book-page.component'
import { NewBookPageComponent } from './pages/new-book-page/new-book-page.component'
import { NewSeriesPageComponent } from './pages/new-series-page/new-series-page.component'
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
		EditNamesComponent,
		EpubViewerComponent,
		PdfViewerComponent,
		AuthorProfileComponent,
		HorizontalBookListComponent,
		HorizontalAuthorListComponent,
		HorizontalAuthorListItemComponent,
		StoreBookCardComponent,
		LanguageDropdownComponent,
		CategoriesSelectionComponent,
		PriceInputComponent,
		IsbnInputComponent,
		AddListItemComponent,
		HeaderComponent,
		LinkIconButtonComponent,
		BlurhashImageComponent,
		LanguagesSelectionComponent,
		UserProfileComponent,
		DavProCardComponent,
		HorizontalBookCardComponent,
		HorizontalBooksCardComponent,
		LibraryPageCardsComponent,
		LibraryPageBookCardComponent,
		NewBookPageTitleSectionComponent,
		NewBookPageCollectionSectionComponent,
		NewBookPageDescriptionSectionComponent,
		NewBookPageCategoriesSectionComponent,
		NewBookPagePriceSectionComponent,
		NewBookPageIsbnSectionComponent,
		NewBookPageCoverSectionComponent,
		NewBookPageBookFileSectionComponent,
		NewSeriesPageNameSectionComponent,
		NewSeriesPageBookSelectionSectionComponent,
		// Pages
      LibraryPageComponent,
      BookPageComponent,
      AccountPageComponent,
      SettingsPageComponent,
		AuthorPageComponent,
		AuthorSetupPageComponent,
		AuthorCollectionPageComponent,
		AuthorSeriesPageComponent,
		AuthorBookPageComponent,
		NewBookPageComponent,
		NewSeriesPageComponent,
		LoadingPageComponent,
		StorePageComponent,
		StoreStartPageComponent,
		StoreAuthorPageComponent,
		StoreBookPageComponent,
		StoreBooksPageComponent
  	],
	imports: [
		BrowserModule,
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
		FontAwesomeModule,
      ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  	],
  	providers: [
		DataService,
		ApiService,
		CachingService,
		RoutingService
   ],
	bootstrap: [AppComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
