import { Component } from "@angular/core";
import { environment } from 'src/environments/environment';

@Component({
   selector: "pocketlib-settings-page",
   templateUrl: "./settings-page.component.html"
})
export class SettingsPageComponent{
	version: string = environment.version;

	constructor(){}
}