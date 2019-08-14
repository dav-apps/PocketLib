import { Component } from "@angular/core";
import { environment } from 'src/environments/environment';
import { enUS } from 'src/locales/locales';
import { DataService } from 'src/app/services/data-service';
import { MatRadioChange } from '@angular/material/radio';

@Component({
   selector: "pocketlib-settings-page",
   templateUrl: "./settings-page.component.html"
})
export class SettingsPageComponent{
   locale = enUS.settingsPage;
	version: string = environment.version;
	themeKeys: string[] = [environment.lightThemeKey, environment.darkThemeKey, environment.systemThemeKey]
	selectedTheme: string;
	isWindows: boolean = false;

	constructor(
      public dataService: DataService
   ){
		this.locale = this.dataService.GetLocale().settingsPage;
		this.isWindows = window["Windows"] != null;
		this.dataService.HideWindowsBackButton();
	}
	
	async ngOnInit(){
		// Set the correct theme radio button
		this.selectedTheme = await this.dataService.GetTheme();
		if(!this.isWindows && this.selectedTheme == environment.systemThemeKey){
			this.selectedTheme = environment.lightThemeKey;
		}
	}
	
	onThemeRadioButtonSelected(event: MatRadioChange){
		this.selectedTheme = event.value;
		this.dataService.SetTheme(event.value);
		this.dataService.ApplyTheme(event.value);
	}
}