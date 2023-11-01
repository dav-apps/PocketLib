import { BrowserModule } from "@angular/platform-browser"
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core"
import { Environment } from "dav-js"
import { dataIdFromObject } from "./misc/utils"
import { environment } from "../environments/environment"

// Modules
import { AppRoutingModule } from "./app-routing.module"
import { NgxFileHelpersModule } from "ngx-file-helpers"
import { BrowserAnimationsModule } from "@angular/platform-browser/animations"
import { PortalModule } from "@angular/cdk/portal"
import { PdfViewerModule } from "ng2-pdf-viewer"
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome"
import { DragulaModule } from "ng2-dragula"
import { ServiceWorkerModule } from "@angular/service-worker"

// Apollo
import { HttpClientModule } from "@angular/common/http"
import { APOLLO_OPTIONS, ApolloModule } from "apollo-angular"
import { HttpLink } from "apollo-angular/http"
import { InMemoryCache } from "@apollo/client/core"

// Services
import { RoutingService } from "./services/routing-service"
import { DataService } from "./services/data-service"
import { ApiService } from "./services/api-service"
import { CachingService } from "./services/caching-service"

// Components
import { AppComponent } from "./app.component"
import { EditNamesComponent } from "./components/edit-names/edit-names.component"
import { EpubViewerComponent } from "./components/epub-viewer/epub-viewer.component"
import { PdfViewerComponent } from "./components/pdf-viewer/pdf-viewer.component"
import { LoadingScreenComponent } from "./components/loading-screen/loading-screen.component"
import { PublisherProfileComponent } from "./components/publisher-profile/publisher-profile.component"
import { AuthorProfileComponent } from "./components/author-profile/author-profile.component"
import { HorizontalBookListComponent } from "./components/horizontal-book-list/horizontal-book-list.component"
import { HorizontalAuthorListComponent } from "./components/horizontal-author-list/horizontal-author-list.component"
import { HorizontalAuthorListItemComponent } from "./components/horizontal-author-list-item/horizontal-author-list-item.component"
import { HorizontalSeriesListComponent } from "./components/horizontal-series-list/horizontal-series-list.component"
import { HorizontalSeriesListItemComponent } from "./components/horizontal-series-list-item/horizontal-series-list-item.component"
import { HorizontalCategoryListComponent } from "./components/horizontal-category-list/horizontal-category-list.component"
import { StoreBookCardComponent } from "./components/store-book-card/store-book-card.component"
import { LanguageDropdownComponent } from "./components/language-dropdown/language-dropdown.component"
import { CategoriesSelectionComponent } from "./components/categories-selection/categories-selection.component"
import { PriceInputComponent } from "./components/price-input/price-input.component"
import { IsbnInputComponent } from "./components/isbn-input/isbn-input.component"
import { LinkIconButtonComponent } from "./components/link-icon-button/link-icon-button.component"
import { LanguagesSelectionComponent } from "./components/languages-selection/languages-selection.component"
import { DavProCardComponent } from "./components/dav-pro-card/dav-pro-card.component"
import { LibraryPageCardsComponent } from "./components/library-page-cards/library-page-cards.component"
import { LibraryPageBookCardComponent } from "./components/library-page-book-card/library-page-book-card.component"
import { NewBookPageTitleSectionComponent } from "./components/new-book-page-title-section/new-book-page-title-section.component"
import { NewBookPageCollectionSectionComponent } from "./components/new-book-page-collection-section/new-book-page-collection-section.component"
import { NewBookPageDescriptionSectionComponent } from "./components/new-book-page-description-section/new-book-page-description-section.component"
import { NewBookPageCategoriesSectionComponent } from "./components/new-book-page-categories-section/new-book-page-categories-section.component"
import { NewBookPagePriceSectionComponent } from "./components/new-book-page-price-section/new-book-page-price-section.component"
import { NewBookPageIsbnSectionComponent } from "./components/new-book-page-isbn-section/new-book-page-isbn-section.component"
import { NewBookPageCoverSectionComponent } from "./components/new-book-page-cover-section/new-book-page-cover-section.component"
import { NewBookPageBookFileSectionComponent } from "./components/new-book-page-book-file-section/new-book-page-book-file-section.component"
import { SimpleLoadingScreenComponent } from "./components/simple-loading-screen/simple-loading-screen.component"
import { RemoveBookDialogComponent } from "./components/dialogs/remove-book-dialog/remove-book-dialog.component"
import { LoginToAccessBookDialogComponent } from "./components/dialogs/login-to-access-book-dialog/login-to-access-book-dialog.component"
import { AddBookErrorDialogComponent } from "./components/dialogs/add-book-error-dialog/add-book-error-dialog.component"
import { LogoutDialogComponent } from "./components/dialogs/logout-dialog/logout-dialog.component"
import { CreatePublisherDialogComponent } from "./components/dialogs/create-publisher-dialog/create-publisher-dialog.component"
import { CreateAuthorDialogComponent } from "./components/dialogs/create-author-dialog/create-author-dialog.component"
import { EditTitleDialogComponent } from "./components/dialogs/edit-title-dialog/edit-title-dialog.component"
import { CategoriesSelectionDialogComponent } from "./components/dialogs/categories-selection-dialog/categories-selection-dialog.component"
import { PublishChangesDialogComponent } from "./components/dialogs/publish-changes-dialog/publish-changes-dialog.component"
import { NamesDialogComponent } from "./components/dialogs/names-dialog/names-dialog.component"
import { EditNameDialogComponent } from "./components/dialogs/edit-name-dialog/edit-name-dialog.component"

// Pages
import { LibraryPageComponent } from "./pages/library-page/library-page.component"
import { BookPageComponent } from "./pages/book-page/book-page.component"
import { AccountPageComponent } from "./pages/account-page/account-page.component"
import { SettingsPageComponent } from "./pages/settings-page/settings-page.component"
import { PublisherPageComponent } from "./pages/publisher-page/publisher-page.component"
import { AuthorPageComponent } from "./pages/author-page/author-page.component"
import { AuthorCollectionPageComponent } from "./pages/author-collection-page/author-collection-page.component"
import { AuthorSeriesPageComponent } from "./pages/author-series-page/author-series-page.component"
import { NewSeriesPageComponent } from "./pages/new-series-page/new-series-page.component"
import { AuthorBookDashboardPageComponent } from "./pages/author-book-dashboard-page/author-book-dashboard-page.component"
import { AuthorBookPageComponent } from "./pages/author-book-page/author-book-page.component"
import { NewBookPageComponent } from "./pages/new-book-page/new-book-page.component"
import { AuthorReleasesPageComponent } from "./pages/author-releases-page/author-releases-page.component"
import { LoadingPageComponent } from "./pages/loading-page/loading-page.component"
import { StoreStartPageComponent } from "./pages/store-start-page/store-start-page.component"
import { StoreCategoriesPageComponent } from "./pages/store-categories-page/store-categories-page.component"
import { StorePublisherPageComponent } from "./pages/store-publisher-page/store-publisher-page.component"
import { StoreAuthorPageComponent } from "./pages/store-author-page/store-author-page.component"
import { StoreBookPageComponent } from "./pages/store-book-page/store-book-page.component"
import { StoreBooksPageComponent } from "./pages/store-books-page/store-books-page.component"

@NgModule({
	declarations: [
		// Components
		AppComponent,
		EditNamesComponent,
		EpubViewerComponent,
		PdfViewerComponent,
		LoadingScreenComponent,
		PublisherProfileComponent,
		AuthorProfileComponent,
		HorizontalBookListComponent,
		HorizontalAuthorListComponent,
		HorizontalAuthorListItemComponent,
		HorizontalSeriesListComponent,
		HorizontalSeriesListItemComponent,
		HorizontalCategoryListComponent,
		StoreBookCardComponent,
		LanguageDropdownComponent,
		CategoriesSelectionComponent,
		PriceInputComponent,
		IsbnInputComponent,
		LinkIconButtonComponent,
		LanguagesSelectionComponent,
		DavProCardComponent,
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
		SimpleLoadingScreenComponent,
		RemoveBookDialogComponent,
		LoginToAccessBookDialogComponent,
		AddBookErrorDialogComponent,
		LogoutDialogComponent,
		CreatePublisherDialogComponent,
		CreateAuthorDialogComponent,
		EditTitleDialogComponent,
		CategoriesSelectionDialogComponent,
		PublishChangesDialogComponent,
		NamesDialogComponent,
		EditNameDialogComponent,
		// Pages
		LibraryPageComponent,
		BookPageComponent,
		AccountPageComponent,
		SettingsPageComponent,
		PublisherPageComponent,
		AuthorPageComponent,
		AuthorCollectionPageComponent,
		AuthorSeriesPageComponent,
		NewSeriesPageComponent,
		AuthorBookDashboardPageComponent,
		AuthorBookPageComponent,
		NewBookPageComponent,
		AuthorReleasesPageComponent,
		LoadingPageComponent,
		StoreStartPageComponent,
		StoreCategoriesPageComponent,
		StorePublisherPageComponent,
		StoreAuthorPageComponent,
		StoreBookPageComponent,
		StoreBooksPageComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		ApolloModule,
		HttpClientModule,
		NgxFileHelpersModule,
		BrowserAnimationsModule,
		PortalModule,
		PdfViewerModule,
		FontAwesomeModule,
		DragulaModule.forRoot(),
		ServiceWorkerModule.register("ngsw-worker.js", {
			enabled:
				environment.environment == Environment.Staging ||
				environment.environment == Environment.Production
		})
	],
	providers: [
		RoutingService,
		DataService,
		ApiService,
		CachingService,
		{
			provide: APOLLO_OPTIONS,
			useFactory(httpLink: HttpLink) {
				return {
					cache: new InMemoryCache({ dataIdFromObject }),
					link: httpLink.create({
						uri: environment.pocketlibApiUrl
					})
				}
			},
			deps: [HttpLink]
		}
	],
	bootstrap: [AppComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
