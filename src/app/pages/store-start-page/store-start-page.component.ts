import { Component } from "@angular/core"
import { DataService } from "src/app/services/data-service"

@Component({
	selector: "pocketlib-store-start-page",
	templateUrl: "./store-start-page.component.html",
	styleUrls: ["./store-start-page.component.scss"]
})
export class StoreStartPageComponent {
	constructor(public dataService: DataService) {}
}
