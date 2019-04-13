import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NavigationPageComponent } from './pages/navigation-page/navigation-page.component';
import { LibraryPageComponent } from './pages/library-page/library-page.component';

const routes: Routes = [
   { path: "", component: NavigationPageComponent, 
      children: [
         { path: '', component: LibraryPageComponent }
      ] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
