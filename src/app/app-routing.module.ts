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
import { AuthorProfilePageComponent } from './pages/author-profile-page/author-profile-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { LoadingPageComponent } from './pages/loading-page/loading-page.component';
import { StorePageComponent } from './pages/store-page/store-page.component';

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
	{ path: "author/collection/:uuid", component: AuthorCollectionPageComponent },
	{ path: "author/book/:uuid", component: AuthorBookPageComponent },
	{ path: "author/profile", component: AuthorProfilePageComponent },
	{ path: "login", component: LoginPageComponent },
	{ path: "loading", component: LoadingPageComponent },
	{ path: "store", component: StorePageComponent }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
