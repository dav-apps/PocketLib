import { Component, Input } from "@angular/core"
import { DataService } from "src/app/services/data-service"

@Component({
	selector: "pocketlib-loading-screen",
	templateUrl: "./loading-screen.component.html",
	styleUrls: ["./loading-screen.component.scss"]
})
export class LoadingScreenComponent {
	@Input() message: string = ""

	constructor(public dataService: DataService) {}
}
