import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LibraryPageComponent } from './pages/library-page/library-page.component';
import { BookPageComponent } from './pages/book-page/book-page.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';
import { AccountPageComponent } from './pages/account-page/account-page.component';
import { DeveloperPageComponent } from './pages/developer-page/developer-page.component';
import { AppPageComponent } from './pages/app-page/app-page.component';
import { NewAppPageComponent } from './pages/new-app-page/new-app-page.component';
import { AuthorPageComponent } from './pages/author-page/author-page.component';
import { AuthorSetupPageComponent } from './pages/author-setup-page/author-setup-page.component';
import { AuthorCollectionPageComponent } from './pages/author-collection-page/author-collection-page.component';
import { AuthorBookPageComponent } from './pages/author-book-page/author-book-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { LoadingPageComponent } from './pages/loading-page/loading-page.component';
import { StorePageComponent } from './pages/store-page/store-page.component';
import { StoreStartPageComponent } from './pages/store-start-page/store-start-page.component';
import { StoreAuthorPageComponent } from './pages/store-author-page/store-author-page.component';
import { StoreCollectionPageComponent } from './pages/store-collection-page/store-collection-page.component';
import { StoreBookPageComponent } from './pages/store-book-page/store-book-page.component';
import { StoreBooksPageComponent } from './pages/store-books-page/store-books-page.component';

const routes: Routes = [
   { path: "", component: LibraryPageComponent },
   { path: "book", component: BookPageComponent },
	{ path: "account", component: AccountPageComponent },
   { path: "settings", component: SettingsPageComponent },
   { path: "developer", component: DeveloperPageComponent },
   { path: "developer/apps", redirectTo: "/developer", pathMatch: "full" },
   { path: "developer/apps/new", component: NewAppPageComponent },
   { path: "developer/apps/:uuid", component: AppPageComponent },
	{ path: "author", component: AuthorPageComponent },
	{ path: "author/setup", component: AuthorSetupPageComponent },
	{ path: "author/:uuid", component: AuthorPageComponent },
	{ path: "author/collection/:uuid", component: AuthorCollectionPageComponent },
	{ path: "author/book/:uuid", component: AuthorBookPageComponent },
	{ path: "login", component: LoginPageComponent },
	{ path: "loading", component: LoadingPageComponent },
	{ path: "store", component: StorePageComponent, children: [
		{ path: "", component: StoreStartPageComponent },
		{ path: "author/:uuid", component: StoreAuthorPageComponent },
		{ path: "collection/:uuid", component: StoreCollectionPageComponent },
		{ path: "book/:uuid", component: StoreBookPageComponent },
		{ path: "books/:key", component: StoreBooksPageComponent }
	]}
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
