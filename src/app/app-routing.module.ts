import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { LibraryPageComponent } from './pages/library-page/library-page.component'
import { BookPageComponent } from './pages/book-page/book-page.component'
import { SettingsPageComponent } from './pages/settings-page/settings-page.component'
import { AccountPageComponent } from './pages/account-page/account-page.component'
import { AuthorPageComponent } from './pages/author-page/author-page.component'
import { AuthorSetupPageComponent } from './pages/author-setup-page/author-setup-page.component'
import { AuthorCollectionPageComponent } from './pages/author-collection-page/author-collection-page.component'
import { AuthorSeriesPageComponent } from './pages/author-series-page/author-series-page.component'
import { NewSeriesPageComponent } from './pages/new-series-page/new-series-page.component'
import { AuthorBookPageComponent } from './pages/author-book-page/author-book-page.component'
import { NewBookPageComponent } from './pages/new-book-page/new-book-page.component'
import { AuthorReleasesPageComponent } from './pages/author-releases-page/author-releases-page.component'
import { LoadingPageComponent } from './pages/loading-page/loading-page.component'
import { StorePageComponent } from './pages/store-page/store-page.component'
import { StoreStartPageComponent } from './pages/store-start-page/store-start-page.component'
import { StoreAuthorPageComponent } from './pages/store-author-page/store-author-page.component'
import { StoreBookPageComponent } from './pages/store-book-page/store-book-page.component'
import { StoreBooksPageComponent } from './pages/store-books-page/store-books-page.component'

const routes: Routes = [
	{ path: "", component: LibraryPageComponent },
	{ path: "book", component: BookPageComponent },
	{ path: "account", component: AccountPageComponent },
	{ path: "settings", component: SettingsPageComponent },
	{ path: "author", component: AuthorPageComponent },
	{ path: "author/setup", component: AuthorSetupPageComponent },
	{ path: "author/:uuid", component: AuthorPageComponent },
	{ path: "author/collection/:collection_uuid", component: AuthorCollectionPageComponent },
	{ path: "author/:author_uuid/collection/:collection_uuid", component: AuthorCollectionPageComponent },
	{ path: "author/series/new", component: NewSeriesPageComponent },
	{ path: "author/:author_uuid/series/new", component: NewSeriesPageComponent },
	{ path: "author/series/:series_uuid", component: AuthorSeriesPageComponent },
	{ path: "author/:author_uuid/series/:series_uuid", component: AuthorSeriesPageComponent },
	{ path: "author/book/new", component: NewBookPageComponent },
	{ path: "author/:uuid/book/new", component: NewBookPageComponent },
	{ path: "author/book/:book_uuid", component: AuthorBookPageComponent },
	{ path: "author/:author_uuid/book/:book_uuid", component: AuthorBookPageComponent },
	{ path: "author/book/:book_uuid/releases", component: AuthorReleasesPageComponent },
	{ path: "author/:author_uuid/book/:book_uuid/releases", component: AuthorReleasesPageComponent },
	{ path: "loading", component: LoadingPageComponent },
	{
		path: "store", component: StorePageComponent, children: [
			{ path: "", component: StoreStartPageComponent },
			{ path: "author/:uuid", component: StoreAuthorPageComponent },
			{ path: "book/:uuid", component: StoreBookPageComponent },
			{ path: "category/:key", component: StoreBooksPageComponent },
			{ path: "books/all", component: StoreBooksPageComponent }
		]
	}
]

@NgModule({
	imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
	exports: [RouterModule]
})
export class AppRoutingModule { }
