import { Component, Input } from "@angular/core"
import { DataService } from "src/app/services/data-service"

@Component({
	selector: "pocketlib-loading-screen",
	templateUrl: "./loading-screen.component.html",
	styleUrl: "./loading-screen.component.scss",
	standalone: false
})
export class LoadingScreenComponent {
	@Input() message: string = ""

	constructor(public dataService: DataService) {}
}
