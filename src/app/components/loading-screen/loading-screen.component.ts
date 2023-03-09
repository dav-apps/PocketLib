import { Component, Input } from "@angular/core"
import { GetDualScreenSettings } from "src/app/misc/utils"

@Component({
	selector: "pocketlib-loading-screen",
	templateUrl: "./loading-screen.component.html",
	styleUrls: ["./loading-screen.component.scss"]
})
export class LoadingScreenComponent {
	@Input() message: string = ""
	dualScreenLayout: boolean = false

	ngOnInit() {
		// Check if this is a dual-screen device with a vertical fold
		this.dualScreenLayout = GetDualScreenSettings().dualScreenLayout
	}
}
