import { Component, Input } from "@angular/core"

@Component({
	selector: "pocketlib-loading-screen",
	templateUrl: "./loading-screen.component.html",
	styleUrls: ["./loading-screen.component.scss"]
})
export class LoadingScreenComponent {
	@Input() message: string = ""
}
