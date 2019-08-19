import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LibraryPageComponent } from './pages/library-page/library-page.component';
import { BookPageComponent } from './pages/book-page/book-page.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';
import { AccountPageComponent } from './pages/account-page/account-page.component';
import { DeveloperPageComponent } from './pages/developer-page/developer-page.component';
import { AppsPageComponent } from './pages/apps-page/apps-page.component';
import { NewAppPageComponent } from './pages/new-app-page/new-app-page.component';
import { AuthorPageComponent } from './pages/author-page/author-page.component';

const routes: Routes = [
   { path: "", component: LibraryPageComponent },
   { path: "book", component: BookPageComponent },
	{ path: "account", component: AccountPageComponent },
   { path: "settings", component: SettingsPageComponent },
   { path: "developer", component: DeveloperPageComponent },
   { path: "developer/apps", component: AppsPageComponent },
   { path: "developer/apps/new", component: NewAppPageComponent },
   { path: "author", component: AuthorPageComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
