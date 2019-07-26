import { Component } from "@angular/core";
import { environment } from 'src/environments/environment';
import { enUS } from 'src/locales/locales';
import { DataService } from 'src/app/services/data-service';

@Component({
   selector: "pocketlib-settings-page",
   templateUrl: "./settings-page.component.html"
})
export class SettingsPageComponent{
   locale = enUS.settingsPage;
	version: string = environment.version;

	constructor(
      public dataService: DataService
   ){
      this.locale = this.dataService.GetLocale().settingsPage;
   }

   onThemeRadioButtonSelected(index: number){
		let theme = index == 0 ? environment.lightThemeKey : environment.darkThemeKey;

		this.dataService.SetTheme(theme);
		this.dataService.ApplyTheme(theme);
   }
}